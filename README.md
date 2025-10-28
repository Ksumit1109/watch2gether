# Watch Together - Frontend

A modern, real-time YouTube watch party application built with Next.js 14, React, and Socket.IO. Watch videos in perfect sync with friends, chat in real-time, and search for videos together.

## Features

- 🎬 **Synchronized Playback** - Watch YouTube videos in perfect sync with all room members
- 🔴 **Real-time Controls** - Play, pause, and seek synchronized across all viewers
- 💬 **Live Chat** - Chat with friends while watching
- 🔍 **Video Search** - Search and select YouTube videos directly in the app
- 👥 **Multi-user Rooms** - Create or join rooms with a simple room code
- 👑 **Host Management** - Automatic host transfer when the original host leaves
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Socket.IO Client** - Real-time communication
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **react-youtube** - YouTube player integration
- **Lucide React** - Icon library

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running ([See server README](../server/README.md))

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
```

## Usage

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx                 # Home page (create/join room)
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles
│   └── room/
│       ├── create/
│       │   └── page.tsx        # Create room page
│       └── [roomId]/
│           └── page.tsx        # Room page (main app)
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── VideoPlayer.tsx         # YouTube player with sync
│   ├── ChatPanel.tsx           # Real-time chat
│   └── VideoSearch.tsx         # Video search interface
├── lib/
│   ├── socket.ts               # Socket.IO client configuration
│   └── utils.ts                # Utility functions
├── types/
│   └── room.ts                 # TypeScript type definitions
├── hooks/
│   └── use-toast.ts            # Toast notification hook
├── public/                     # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Key Components

### VideoPlayer

Handles YouTube video playback and synchronization:

- Syncs play/pause/seek events across all users
- Requests sync state when joining
- Host broadcasts playback state to new joiners

### ChatPanel

Real-time chat functionality:

- Send and receive messages instantly
- Displays username and timestamp
- Auto-scrolls to latest messages

### VideoSearch

YouTube video search interface:

- Search videos using YouTube Data API
- Display thumbnails and video info
- Click to play video for all room members

## User Flow

### Creating a Room

1. Enter your name (optional) on home page
2. Click "Create New Room"
3. Automatically redirected to your new room
4. Share room code with friends

### Joining a Room

1. Enter your name (optional) on home page
2. Enter room code
3. Click "Join Room"
4. Instantly connected and synced

### Watching Together

1. Use search to find a video
2. Click on video to start playing
3. Use YouTube controls (play/pause/seek)
4. All viewers stay synchronized
5. Chat with friends while watching

## Configuration

### Environment Variables

| Variable                 | Required | Default               | Description        |
| ------------------------ | -------- | --------------------- | ------------------ |
| `NEXT_PUBLIC_SERVER_URL` | Yes      | http://localhost:5000 | Backend server URL |

### Next.js Configuration

The `next.config.js` includes:

- **React StrictMode disabled** - Prevents duplicate socket connections
- **Image optimization** - Disabled for YouTube thumbnails
- **Webpack fallbacks** - For Socket.IO client compatibility

## Socket.IO Integration

### Connection Management

```typescript
// lib/socket.ts
const socket = getSocket(SERVER_URL);
socket.connect();
```

### Event Handlers

```typescript
// Play event
socket.on("play", ({ time }) => {
  player.seekTo(time);
  player.playVideo();
});

// Emit play event
socket.emit("play", { time: currentTime });
```

## Styling

Built with Tailwind CSS and shadcn/ui components:

```typescript
<Button className="bg-blue-600 hover:bg-blue-700">Create Room</Button>
```

## TypeScript Types

```typescript
interface ChatMessage {
  type: "chat_message";
  user: string;
  text: string;
  timestamp: number;
}

interface SearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
}
```

## Features in Detail

### Synchronization

- **Host-based sync**: Host controls are broadcast to all members
- **Late join sync**: New joiners request current state from host
- **Automatic reconnection**: Handles network interruptions gracefully

### Room Management

- **6-character room codes**: Easy to share (e.g., "abc123")
- **Automatic host transfer**: First remaining member becomes host
- **Member count display**: See how many people are watching
- **Copy room link**: One-click sharing

### User Experience

- **Loading states**: Clear feedback during connections
- **Toast notifications**: Non-intrusive status updates
- **Responsive layout**: Adapts to screen size
- **Keyboard shortcuts**: Enter to send messages/search

## Troubleshooting

### Socket Connection Issues

```typescript
// Check connection status
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});
```

**Solutions:**

- Verify backend server is running
- Check `NEXT_PUBLIC_SERVER_URL` in `.env.local`
- Ensure CORS is configured on backend

### Video Not Playing

- Check YouTube video ID is valid
- Verify YouTube Player API loaded
- Check browser console for errors

### Sync Issues

- Ensure only one browser tab per user
- Check network latency
- Verify host is connected

## Performance Optimization

- **Debounced sync events** - Prevents excessive socket emissions
- **Lazy component loading** - Improves initial load time
- **Memoized components** - Reduces unnecessary re-renders
- **Optimized images** - Uses YouTube thumbnail URLs

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels for interactive elements
- Screen reader friendly

## Development Tips

### Hot Reload

Next.js hot reloading works automatically. Socket connections persist across hot reloads.

### Debug Mode

Add console logs to track socket events:

```typescript
socket.onAny((event, ...args) => {
  console.log(`Socket event: ${event}`, args);
});
```

### Testing

```bash
# Run linter
npm run lint

# Type check
npm run type-check
```

## Production Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

Set environment variable:

- `NEXT_PUBLIC_SERVER_URL`: Your production backend URL

### Other Platforms

1. Build the application:

```bash
npm run build
```

2. Set environment variables
3. Deploy the `.next` folder
4. Ensure backend URL is correctly configured

## Security Considerations

- All socket events validated on backend
- No sensitive data in client-side code
- HTTPS recommended for production
- Rate limiting on backend API calls

## Future Enhancements

- [ ] User authentication
- [ ] Private rooms with passwords
- [ ] Video playlists
- [ ] Reactions and emojis
- [ ] Screen sharing
- [ ] Voice chat integration
- [ ] Watch history
- [ ] Dark mode toggle

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for watching together
