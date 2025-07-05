using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using SharedModels.Models;

namespace API.API.Models
{
    public class AppUser : IdentityUser
    {
        public string FullName { get; set; }
        public string Avatar { get; set; }
        public string Address { get; set; }
        public bool FlagActive { get; set; }
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}