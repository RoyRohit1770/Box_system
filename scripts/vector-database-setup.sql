-- Vector database setup for RAG implementation
-- This would typically be used with pgvector or similar

-- Create extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing email context and training data
CREATE TABLE IF NOT EXISTS email_context (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    context_type VARCHAR(50) NOT NULL, -- 'product_info', 'outreach_template', 'response_template'
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS email_context_embedding_idx 
ON email_context USING ivfflat (embedding vector_cosine_ops);

-- Insert sample training data for RAG
INSERT INTO email_context (content, context_type, metadata) VALUES 
(
    'I am a software engineer looking for new opportunities. My expertise includes React, Node.js, TypeScript, and cloud technologies. I am particularly interested in full-stack development roles.',
    'candidate_profile',
    '{"skills": ["React", "Node.js", "TypeScript", "AWS"], "role": "Full-Stack Developer"}'
),
(
    'When someone shows interest in scheduling an interview or meeting, always provide this booking link: https://cal.com/candidate. Be professional and enthusiastic.',
    'meeting_template',
    '{"action": "schedule_meeting", "link": "https://cal.com/candidate"}'
),
(
    'For interested leads, respond promptly and professionally. Express gratitude for their interest and provide next steps. Always include the meeting booking link if they want to schedule a call.',
    'response_template',
    '{"category": "interested", "tone": "professional", "include_booking": true}'
),
(
    'If someone mentions they are not interested or have chosen another candidate, respond graciously and leave the door open for future opportunities.',
    'response_template',
    '{"category": "not_interested", "tone": "gracious", "future_opportunity": true}'
);

-- Create table for storing email interactions and their outcomes
CREATE TABLE IF NOT EXISTS email_interactions (
    id SERIAL PRIMARY KEY,
    email_id VARCHAR(255) NOT NULL,
    original_content TEXT NOT NULL,
    suggested_reply TEXT,
    actual_reply TEXT,
    outcome VARCHAR(50), -- 'sent', 'modified', 'ignored'
    feedback_score INTEGER, -- 1-5 rating
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to find similar context using vector search
CREATE OR REPLACE FUNCTION find_similar_context(
    query_embedding vector(1536),
    context_filter VARCHAR(50) DEFAULT NULL,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    content TEXT,
    context_type VARCHAR(50),
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.content,
        ec.context_type,
        ec.metadata,
        1 - (ec.embedding <=> query_embedding) AS similarity
    FROM email_context ec
    WHERE 
        (context_filter IS NULL OR ec.context_type = context_filter)
        AND ec.embedding IS NOT NULL
    ORDER BY ec.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
