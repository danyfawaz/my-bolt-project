export interface Task {
  id: string;
  title: string;
  description: string;
  assignee_id: string;
  approver_id: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  task_id: string;
  title: string;
  description: string;
  assignee_id: string;
  approver_id: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface DeliverableRevision {
  id: string;
  deliverable_id: string;
  submitted_by: string;
  content_url?: string;
  attachment_url?: string;
  feedback?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DeliverableReaction {
  id: string;
  revision_id: string;
  user_id: string;
  reaction: 'like' | 'dislike';
  created_at: string;
}

export interface DeliverableComment {
  id: string;
  revision_id: string;
  user_id: string;
  content: string;
  created_at: string;
}