using System.Linq.Expressions;

namespace API.Application.Interfaces.Repositories
{
    public interface IBaseRespository<TEntity> where TEntity : class
    {
        Task<TEntity> Create(TEntity entity);
        Task<TEntity> GetByCode(object id, Expression<Func<TEntity, bool>> predicate = null);
        Task<List<TResult>> GetAll<TResult>(
            Expression<Func<TEntity, bool>> predicate = null,
            Expression<Func<TEntity, TResult>> selector = null
        );
        Task<(bool exists, T data)> CheckRecordExist<T>(Expression<Func<T, bool>> predicates) where T : class;
        Task Update(TEntity entity, params Expression<Func<TEntity, object>>[] updatedProperties);
        Task Delete(object id);
    }
}
