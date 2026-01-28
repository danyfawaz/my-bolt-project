/*
  # Insert sample marketing tasks and deliverables

  1. Sample Data
    - Creates 2 marketing tasks with multiple deliverables each
    - Adds sample users as assignees and approvers
    - Sets up realistic marketing campaign scenarios

  Note: Using the same user ID for different roles for testing purposes
*/

-- Insert a sample user for testing (will be replaced by actual authenticated users)
INSERT INTO auth.users (id, email)
VALUES 
  ('d0d7d63a-5e4b-4ec0-9ef6-19585532bd03', 'john@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, assignee_id, approver_id, status, created_at)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Google Ads Summer Campaign',
    'Create a comprehensive Google Ads campaign for our summer collection launch',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'in_progress',
    now() - interval '2 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Social Media Content Calendar',
    'Develop next month''s social media content calendar focusing on product features',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'pending',
    now() - interval '1 day'
  );

-- Insert deliverables for Google Ads Campaign
INSERT INTO deliverables (id, task_id, title, description, assignee_id, approver_id, status, created_at)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Display Ad Designs',
    'Create display ad designs in all required sizes (300x250, 728x90, 160x600)',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'submitted',
    now() - interval '1 day'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Ad Copy and Keywords',
    'Write compelling ad copy and research targeted keywords for the campaign',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'in_progress',
    now() - interval '1 day'
  );

-- Insert deliverables for Social Media Calendar
INSERT INTO deliverables (id, task_id, title, description, assignee_id, approver_id, status, created_at)
VALUES
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'Content Strategy Document',
    'Create a detailed content strategy including themes, hashtags, and posting schedule',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'pending',
    now()
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'Visual Content Creation',
    'Design social media graphics and prepare product photography',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'pending',
    now()
  );

-- Insert sample revision for Display Ad Designs
INSERT INTO deliverable_revisions (id, deliverable_id, submitted_by, content_url, attachment_url, status, created_at)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03',
    'https://www.figma.com/file/sample-display-ads',
    'https://example.com/sample-ads.zip',
    'pending',
    now() - interval '12 hours'
  );