using System;

namespace angnet.WebApi.Filters
{
    [AttributeUsage(AttributeTargets.Method, Inherited = true)]
    public class SkipLoggingAttribute : Attribute
    {
    }
}
