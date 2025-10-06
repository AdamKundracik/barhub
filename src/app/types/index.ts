// Export all DTO types for easy importing
export * from './dto';

// Re-export commonly used types with shorter names
export type {
  ClientDTO as User,
  SignInRequestDTO as LoginRequest,
  SignUpRequestDTO as RegisterRequest,
  JwtAuthenticationResponseDTO as AuthResponse,
  PostDTO as Post,
  NotificationDTO as Notification,
  SearchHistoryItemEmbeddable as SearchHistoryItem,
  LeaderboardResponseDTO as LeaderboardResponse,
} from './dto';
