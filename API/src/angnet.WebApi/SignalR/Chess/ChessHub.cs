using Microsoft.AspNetCore.SignalR;

namespace angnet.WebApi.SignalR.Chess
{
    // Hub chỉ đóng vai trò relay + quản lý phòng (RAM, không DB). Luật cờ và validate
    // nước đi do client (chess.js) đảm nhiệm, hub không biết gì về luật chơi.
    public class ChessHub : Hub
    {
        private readonly ChessRoomStore _store;

        public ChessHub(ChessRoomStore store)
        {
            _store = store;
        }

        public async Task<string> CreateRoom(string playerName)
        {
            var room = _store.CreateRoom(Context.ConnectionId, playerName);
            await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId);
            return room.RoomId;
        }

        public async Task<string> JoinRoom(string roomId, string playerName)
        {
            var room = _store.Get(roomId);
            if (room == null)
                throw new HubException("Phòng không tồn tại.");
            if (room.Player2 != null)
                throw new HubException("Phòng đã đủ người chơi.");
            if (room.Player1?.ConnectionId == Context.ConnectionId)
                throw new HubException("Bạn không thể tự tham gia phòng của chính mình.");

            room.Player2 = new ChessPlayer { ConnectionId = Context.ConnectionId, Name = playerName };
            room.Status = "WaitingForReady";
            _store.MapConnection(Context.ConnectionId, roomId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await BroadcastRoomState(room);
            return roomId;
        }

        public async Task SetReady(string roomId)
        {
            var room = _store.Get(roomId);
            if (room == null)
                throw new HubException("Phòng không tồn tại.");

            if (room.Player1?.ConnectionId == Context.ConnectionId)
                room.Player1.IsReady = true;
            else if (room.Player2?.ConnectionId == Context.ConnectionId)
                room.Player2.IsReady = true;
            else
                throw new HubException("Bạn không thuộc phòng này.");

            if (room.Player1 != null && room.Player2 != null)
            {
                room.Status = room.Player1.IsReady && room.Player2.IsReady ? "Playing" : "WaitingForReady";
            }

            await BroadcastRoomState(room);
        }

        public async Task SendMove(string roomId, string fen, string moveSan)
        {
            var room = _store.Get(roomId);
            if (room == null)
                throw new HubException("Phòng không tồn tại.");

            room.Fen = fen;
            await Clients.OthersInGroup(roomId).SendAsync("MoveReceived", fen, moveSan);
        }

        public async Task Resign(string roomId)
        {
            var room = _store.Get(roomId);
            if (room == null)
                throw new HubException("Phòng không tồn tại.");

            room.Status = "Finished";
            await Clients.OthersInGroup(roomId).SendAsync("OpponentLeftGame", "resign");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var roomId = _store.GetRoomIdForConnection(Context.ConnectionId);
            _store.RemoveConnection(Context.ConnectionId);

            if (roomId != null)
            {
                var room = _store.Get(roomId);
                if (room != null)
                {
                    var wasPlaying = room.Status == "Playing";

                    if (room.Player1?.ConnectionId == Context.ConnectionId)
                        room.Player1 = null;
                    else if (room.Player2?.ConnectionId == Context.ConnectionId)
                        room.Player2 = null;

                    if (room.Player1 == null && room.Player2 == null)
                    {
                        _store.RemoveRoom(roomId);
                    }
                    else
                    {
                        // Người còn lại cần bấm "Sẵn sàng" lại với đối thủ mới.
                        if (room.Player1 != null) room.Player1.IsReady = false;
                        if (room.Player2 != null) room.Player2.IsReady = false;
                        room.Status = wasPlaying ? "Finished" : "WaitingForOpponent";

                        await Clients.OthersInGroup(roomId)
                            .SendAsync("OpponentLeftGame", wasPlaying ? "disconnected" : "left");
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        private Task BroadcastRoomState(ChessRoom room) =>
            Clients.Group(room.RoomId).SendAsync(
                "RoomStateChanged",
                room.RoomId,
                room.Player1?.Name ?? string.Empty,
                room.Player1?.IsReady ?? false,
                room.Player2?.Name ?? string.Empty,
                room.Player2?.IsReady ?? false,
                room.Status,
                room.Fen);
    }
}
