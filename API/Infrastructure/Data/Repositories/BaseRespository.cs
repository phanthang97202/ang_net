using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Linq;
using API.Application.Interfaces.Repositories;

namespace API.Infrastructure.Data.Repositories
{
    public class BaseRepository<TEntity> : IBaseRespository<TEntity> where TEntity : class
    {
        protected readonly DbContext _dbCtx;
        protected readonly DbSet<TEntity> _dbSet;

        public BaseRepository(DbContext dbContext)
        {
            _dbCtx = dbContext;
            _dbSet = _dbCtx.Set<TEntity>();
        }

        public async Task<TEntity> Create(TEntity entity)
        {
            await _dbSet.AddAsync(entity);
            return entity;
        }

        public Task Update(TEntity entity, params Expression<Func<TEntity, object>>[] updatedProperties)
        {
            _dbCtx.Attach(entity);
            foreach (var property in updatedProperties)
            {
                _dbCtx.Entry(entity).Property(property).IsModified = true;
            }
            return Task.CompletedTask;
        }

        public async Task<TEntity> GetByCode(object id, Expression<Func<TEntity, bool>> additionalPredicate = null)
        {
            var keyProperty = _dbCtx.Model.FindEntityType(typeof(TEntity))?.FindPrimaryKey()?.Properties.FirstOrDefault();
            if (keyProperty == null)
                throw new InvalidOperationException($"Entity {typeof(TEntity).Name} does not have a defined primary key.");

            var parameter = Expression.Parameter(typeof(TEntity), "x");
            var idEquality = Expression.Equal(
                Expression.Property(parameter, keyProperty.Name),
                Expression.Constant(id)
            );

            Expression finalExpression = idEquality;
            if (additionalPredicate != null)
            {
                var invokedAdditional = Expression.Invoke(additionalPredicate, parameter);
                finalExpression = Expression.AndAlso(idEquality, invokedAdditional);
            }

            var lambda = Expression.Lambda<Func<TEntity, bool>>(finalExpression, parameter);
            return await _dbSet.AsNoTracking().FirstOrDefaultAsync(lambda);
        }

        public async Task<List<TEntity>> GetAll(Expression<Func<TEntity, bool>> predicate = null)
        {
            IQueryable<TEntity> query = _dbSet.AsNoTracking();
            if (predicate != null)
                query = query.Where(predicate);
            return await query.ToListAsync();
        }

        public Task Delete(object id)
        {
            _dbCtx.Remove(id);
            return Task.CompletedTask;
        }
    }
}
