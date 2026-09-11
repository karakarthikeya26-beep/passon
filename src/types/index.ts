export type UserRole = 'student' | 'admin';

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';

export interface User {
  id: string;
  name: string;
  email: string;
  branch: string;
  batch: string;
  gender?: Gender;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
}

export type Category = 
  | 'Academic'
  | 'Books'
  | 'Electronics'
  | 'Project'
  | 'Lab'
  | 'Hostel'
  | 'Furniture'
  | 'Other';

export type Condition = 'New' | 'Like New' | 'Good' | 'Fair';

export type ExchangeMode = 'Sell' | 'Exchange' | 'Donate' | 'Hand Over';

export type ListingStatus = 
  | 'AVAILABLE' 
  | 'INTERESTED' 
  | 'RESERVED' 
  | 'HANDOVER_PLANNED' 
  | 'COMPLETED' 
  | 'CLOSED';

export interface Listing {
  id: string;
  owner_id: string;
  owner?: User;
  title: string;
  category: Category;
  condition: Condition;
  mode: ExchangeMode;
  price?: number;
  exchange_preference?: string;
  description: string;
  images: string[];
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export type InterestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Interest {
  id: string;
  listing_id: string;
  listing?: Listing;
  student_id: string;
  student?: User;
  message?: string;
  status: InterestStatus;
  created_at: string;
  updated_at: string;
}

export type HandoverStatus = 'PLANNED' | 'COMPLETED';

export interface Handover {
  id: string;
  listing_id: string;
  interest_id: string;
  date: string;
  time: string;
  location: string;
  note?: string;
  status: HandoverStatus;
  created_at: string;
}

export type RequestMode = 'BUY' | 'EXCHANGE' | 'DONATE' | 'ANY';
export type RequestStatus = 'OPEN' | 'MATCHED' | 'CLOSED';

export interface LookingFor {
  id: string;
  student_id: string;
  student?: User;
  title: string;
  category: Category;
  description: string;
  mode: RequestMode;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  listing_id: string;
  listing?: Listing;
  request_id: string;
  request?: LookingFor;
  match_score: number;
  match_reason: string;
  status: 'ACTIVE' | 'DISMISSED';
  created_at: string;
}

export type KnowledgeCategory = 
  | 'Placement'
  | 'Academics'
  | 'Projects'
  | 'Hackathons'
  | 'Campus Life'
  | 'Hostel'
  | 'Clubs'
  | 'Internships'
  | 'General Advice';

export interface KnowledgePost {
  id: string;
  author_id: string;
  author?: User;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  useful_count: number;
  status: 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}

export interface SavedListing {
  id: string;
  user_id: string;
  listing_id: string;
  listing?: Listing;
  created_at: string;
}

export interface SavedKnowledge {
  id: string;
  user_id: string;
  knowledge_post_id: string;
  post?: KnowledgePost;
  created_at: string;
}

export interface Feedback {
  id: string;
  exchange_id: string;
  from_user: string;
  to_user: string;
  from_student?: User;
  rating: number;
  comment?: string;
  created_at: string;
}

export type ReportReason = 
  | 'Inappropriate content'
  | 'Misleading information'
  | 'Spam'
  | 'Suspicious activity'
  | 'Other';

export interface Report {
  id: string;
  reporter_id: string;
  reporter?: User;
  target_type: 'listing' | 'user' | 'knowledge';
  target_id: string;
  reason: ReportReason;
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'INTEREST_RECEIVED' | 'INTEREST_ACCEPTED' | 'RESERVED' | 'HANDOVER_PLANNED' | 'EXCHANGE_COMPLETED' | 'NEW_MATCH' | 'KNOWLEDGE_PUBLISHED';
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}
