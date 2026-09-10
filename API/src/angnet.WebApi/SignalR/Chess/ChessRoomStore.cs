using System.Collections.Concurrent;

namespace angnet.WebApi.SignalR.Chess
{
    // Lưu trạng thái phòng cờ vua trong RAM (singleton), không cần DB vì đây là module nhỏ,
    // không yêu cầu lịch sử ván đấu hay reconnect giữa trận.
    public class ChessRoomStore
    {
        private const string RoomIdChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm (I,O,0,1)
        private readonly ConcurrentDictionary<string, ChessRoom> _rooms = new();
        private readonly ConcurrentDictionary<string, string> _connectionToRoom = new();
        private readonly Random _random = new();

        public ChessRoom CreateRoom(string connectionId, string playerName)
        {
            var roomId = GenerateUniqueRoomId();
            var room = new ChessRoom
            {
                RoomId = roomId,
                Player1 = new ChessPlayer { ConnectionId = connectionId, Name = playerName },
            };
            _rooms[roomId] = room;
            _connectionToRoom[connectionId] = roomId;
            return room;
        }

        public ChessRoom? Get(string roomId) =>
            _rooms.TryGetValue(roomId, out var room) ? room : null;

        public void MapConnection(string connectionId, string roomId) =>
            _connectionToRoom[connectionId] = roomId;

        public string? GetRoomIdForConnection(string connectionId) =>
            _connectionToRoom.TryGetValue(connectionId, out var roomId) ? roomId : null;

        public void RemoveConnection(string connectionId) =>
            _connectionToRoom.TryRemove(connectionId, out _);

        public void RemoveRoom(string roomId) =>
            _rooms.TryRemove(roomId, out _);

        private string GenerateUniqueRoomId()
        {
            string roomId;
            do
            {
                roomId = new string(
                    Enumerable.Range(0, 6).Select(_ => RoomIdChars[_random.Next(RoomIdChars.Length)]).ToArray()
                );
            } while (_rooms.ContainsKey(roomId));
            return roomId;
        }
    }
}
