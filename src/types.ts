export type EventType = 'wedding' | 'birthday' | 'community' | 'corporate' | 'other';

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  plannedCost: number;
  actualCost: number;
  paid: boolean;
  notes?: string;
  vendorId?: string;
}

export type TimelinePhase = 
  | '12+ Months'
  | '6-9 Months'
  | '3-5 Months'
  | '1-2 Months'
  | 'Final Weeks'
  | 'Day-of Schedule'
  | 'Post Event';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  phase: TimelinePhase;
  dueDate?: string;
  timeOfDay?: string; // For day-of schedule, e.g. "02:00 PM - 03:00 PM"
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  dayOfOrder?: number;
}

export type VendorStatus = 'researching' | 'contacted' | 'booked' | 'declined';

export interface VendorItem {
  id: string;
  category: string;
  name: string;
  roleDescription: string;
  estimatedCost: number;
  actualCost?: number;
  status: VendorStatus;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  questionsToAsk: string[];
}

export type IdeaCategory = 
  | 'theme_decor'
  | 'food_drink'
  | 'entertainment_activity'
  | 'budget_saver'
  | 'contingency_backup';

export interface PersonalizedIdea {
  id: string;
  title: string;
  category: IdeaCategory;
  description: string;
  whyItFitsTheme: string;
  estimatedCostImpact: string;
  addedToPlan?: boolean;
}

export interface EventPlan {
  id: string;
  title: string;
  eventType: EventType;
  date: string;
  targetBudget: number;
  guestCount: number;
  location: string;
  vibeAndTheme: string;
  colorPalette: ColorSwatch[];
  summaryStory: string;
  keyHighlights: string[];
  budgetItems: BudgetItem[];
  timelineItems: TimelineItem[];
  vendorItems: VendorItem[];
  personalizedIdeas: PersonalizedIdea[];
  customNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreationPrompt {
  eventType: EventType;
  title: string;
  date: string;
  location: string;
  guestCount: number;
  targetBudget: number;
  vibe: string;
  specialRequests?: string;
}
