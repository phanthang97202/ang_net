using System.Linq.Expressions;

namespace API.Application.Interfaces.Repositories
{
    public interface IBaseRespository<TEntity> where TEntity : class
    {
        Task<TEntity> Create(TEntity entity);
        Task<TEntity> GetByCode(object id, Expression<Func<TEntity, bool>> predicate = null);
        Task<List<TEntity>> GetAll(Expression<Func<TEntity, bool>> predicate = null);
        Task Update(TEntity entity, params Expression<Func<TEntity, object>>[] updatedProperties);
        Task Delete(object id);
    }
}
