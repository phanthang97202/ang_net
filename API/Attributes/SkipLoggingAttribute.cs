using System;

namespace API.Attributes
{
    [AttributeUsage(AttributeTargets.Method, Inherited = true)]
    public class SkipLoggingAttribute : Attribute
    {
    }
}
