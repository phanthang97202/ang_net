using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
namespace API.API.Filters
{
    public class ActionFilterApp : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            Console.WriteLine("🚀 OnActionExecuting: Running before action");
            base.OnActionExecuting(context);
        }

        public override void OnActionExecuted(ActionExecutedContext context)
        {
            Console.WriteLine("🚀 OnActionExecuting: Running after action");
            base.OnActionExecuted(context);
        }
    }
}
