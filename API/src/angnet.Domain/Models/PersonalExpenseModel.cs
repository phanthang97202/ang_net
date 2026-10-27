using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class PersonalExpenseModel
{
    [Key, MaxLength(36)] public string Id { get; set; } = "";
    [Required] public string OwnerId { get; set; } = "";
    [Required, MaxLength(8)] public string Type { get; set; } = "";
    public long Amount { get; set; }
    public DateOnly Date { get; set; }
    [Required, MaxLength(80)] public string Category { get; set; } = "";
    [MaxLength(500)] public string Note { get; set; } = "";
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PersonalExpenseCategoryModel
{
    [Key, MaxLength(36)] public string Id { get; set; } = "";
    [Required] public string OwnerId { get; set; } = "";
    [Required, MaxLength(80)] public string Name { get; set; } = "";
    [Required, MaxLength(80)] public string NormalizedName { get; set; } = "";
}
