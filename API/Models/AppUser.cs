using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace API.Models
{
    public class AppUser : IdentityUser
    {
        public string? FullName { get; set; }
        public string Avatar {  get; set; }
        public string Address { get; set; }
        public bool FlagActive { get; set; }
    }
}