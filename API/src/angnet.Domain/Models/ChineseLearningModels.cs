using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class ChineseExerciseModel
{
    [Key, MaxLength(36)] public string Id { get; set; } = "";
    [Required] public string OwnerId { get; set; } = "";
    [Required, MaxLength(16)] public string Kind { get; set; } = "";
    [Required, MaxLength(40)] public string Topic { get; set; } = "";
    [Required, MaxLength(500)] public string Text { get; set; } = "";
    [Required, MaxLength(800)] public string Pinyin { get; set; } = "";
    [Required, MaxLength(1000)] public string Translation { get; set; } = "";
    [Required] public string WordsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
}

public class ChineseVocabularyModel
{
    [Key, MaxLength(36)] public string Id { get; set; } = "";
    [Required] public string OwnerId { get; set; } = "";
    [Required, MaxLength(60)] public string Word { get; set; } = "";
    [Required, MaxLength(120)] public string Pinyin { get; set; } = "";
    [Required, MaxLength(240)] public string Meaning { get; set; } = "";
    [MaxLength(500)] public string Example { get; set; } = "";
    [MaxLength(800)] public string ExamplePinyin { get; set; } = "";
    [MaxLength(1000)] public string ExampleTranslation { get; set; } = "";
    [Required, MaxLength(80)] public string Collection { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
