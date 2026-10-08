using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class MovieWishlistModel : BaseModel
{
    [Key]
    public string WishlistId { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string UserId { get; set; } = "";
    [Required, MaxLength(40)]
    public string Provider { get; set; } = "phimapi";
    [Required, MaxLength(200)]
    public string MovieSlug { get; set; } = "";
    [Required, MaxLength(500)]
    public string Title { get; set; } = "";
    [Required, MaxLength(500)]
    public string OriginalTitle { get; set; } = "";
    [Required, MaxLength(2048)]
    public string PosterUrl { get; set; } = "";
    public int Year { get; set; }
}
