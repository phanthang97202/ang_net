using System;

namespace API.API.Filters
{
    [AttributeUsage(AttributeTargets.Method, Inherited = true)]
    public class SkipLoggingAttribute : Attribute
    {
    }
}
