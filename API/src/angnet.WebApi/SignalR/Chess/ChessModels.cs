namespace angnet.WebApi.SignalR.Chess
{
    public class ChessPlayer
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsReady { get; set; }
    }

    public class ChessRoom
    {
        public string RoomId { get; set; } = string.Empty;
        public ChessPlayer? Player1 { get; set; } // quân Trắng
        public ChessPlayer? Player2 { get; set; } // quân Đen
        public string Status { get; set; } = "WaitingForOpponent"; // WaitingForOpponent | WaitingForReady | Playing | Finished
        public string Fen { get; set; } = "start";
    }
}
