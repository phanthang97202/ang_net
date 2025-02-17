﻿using API.IRespositories;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace API.Middlewares
{
    public class WriteLog
    {
        private readonly ILogger<WriteLog> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public WriteLog(ILogger<WriteLog> logger, IHttpContextAccessor httpContextAccessor) {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public void LogInformation(string title, object req, object res)
        {
            HttpContext httpContext = _httpContextAccessor.HttpContext;
            string strLog = @"
                        ------------------------------------------------
                                        {title}
                        ------------------------------------------------
                        Method       : {Method}
                        Path         : {Path}
                        Request Body : {Request}
                        Response     : {Response}
                        ------------------------------------------------
                        ";
            _logger.LogInformation(strLog,
                                    title,
                                    httpContext.Request.Method,
                                    httpContext.Request.Path,
                                    JsonSerializer.Serialize(req),
                                    JsonSerializer.Serialize(res)
                                    );
        }

        public void LogError(string title, object req, System.Exception errMsg)
        {
            HttpContext httpContext = _httpContextAccessor.HttpContext;
            string strLog = @"
                        ------------------------------------------------
                                        {title}
                        ------------------------------------------------
                        Method       : {Method}
                        Path         : {Path}
                        Request Body : {Request}
                        Response     : {Response}
                        ------------------------------------------------
                        ";
            _logger.LogError(strLog,
                                    title,
                                    httpContext.Request.Method,
                                    httpContext.Request.Path,
                                    JsonSerializer.Serialize(req),
                                    errMsg
                                    );
        }
    }
}
