/*
  # Marketing Task Management Schema

  1. New Tables
    - `tasks`
      - Core task information
      - Tracks overall task status and assignments
    - `deliverables`
      - Individual deliverables within tasks
      - Can have attachments or URLs
    - `deliverable_revisions`
      - Tracks each submission of a deliverable
      - Stores feedback and approval status
    - `deliverable_reactions`
      - Stores likes/dislikes on deliverables
    - `deliverable_comments`
      - Stores feedback and comments on deliverables

  2. Security
    - Enable RLS on all tables
    - Policies for task creation, viewing, and updating
    - Policies for deliverable management
    - Policies for reactions and comments
*/

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES auth.users(id),
  approver_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES auth.users(id),
  approver_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deliverable revisions table
CREATE TABLE IF NOT EXISTS deliverable_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id),
  content_url text,
  attachment_url text,
  feedback text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Deliverable reactions table
CREATE TABLE IF NOT EXISTS deliverable_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid REFERENCES deliverable_revisions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  reaction text NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(revision_id, user_id)
);

-- Deliverable comments table
CREATE TABLE IF NOT EXISTS deliverable_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid REFERENCES deliverable_revisions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_comments ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view tasks they're involved with" ON tasks
  FOR SELECT USING (
    auth.uid() IN (assignee_id, approver_id) OR 
    EXISTS (
      SELECT 1 FROM deliverables 
      WHERE task_id = tasks.id AND 
      (assignee_id = auth.uid() OR approver_id = auth.uid())
    )
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Assignees and approvers can update tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() IN (assignee_id, approver_id)
  );

-- Deliverables policies
CREATE POLICY "Users can view deliverables they're involved with" ON deliverables
  FOR SELECT USING (
    auth.uid() IN (assignee_id, approver_id) OR 
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = deliverables.task_id AND 
      (assignee_id = auth.uid() OR approver_id = auth.uid())
    )
  );

CREATE POLICY "Users can create deliverables" ON deliverables
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Assignees and approvers can update deliverables" ON deliverables
  FOR UPDATE USING (
    auth.uid() IN (assignee_id, approver_id)
  );

-- Revisions policies
CREATE POLICY "Users can view revisions they're involved with" ON deliverable_revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deliverables 
      WHERE id = deliverable_revisions.deliverable_id AND 
      (assignee_id = auth.uid() OR approver_id = auth.uid())
    )
  );

CREATE POLICY "Assignees can create revisions" ON deliverable_revisions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliverables 
      WHERE id = deliverable_id AND assignee_id = auth.uid()
    )
  );

-- Reactions policies
CREATE POLICY "Users can view all reactions" ON deliverable_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create reactions" ON deliverable_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON deliverable_reactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view all comments" ON deliverable_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON deliverable_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON deliverable_comments
  FOR UPDATE USING (auth.uid() = user_id);