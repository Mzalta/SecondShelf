# AI Textbook Listing Enhancer Setup

This document describes the AI-powered listing enhancement feature for Pro users.

## Overview

The AI Textbook Listing Enhancer uses OpenAI to help Pro sellers optimize their listings and Pro buyers get insights on listings. Features include:

- **For Sellers**: AI-generated optimized titles, descriptions, bullet points, keywords, and price suggestions
- **For Buyers**: AI-generated condition summaries, fair price ranges, and value insights
- **Rate Limiting**: Pro users get 20 AI enhancements per day (resets every 24 hours)

## Environment Variables

### Required

Add the following to your `.env.local` file:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy the key and add it to `.env.local`

### Vercel Deployment

For production deployments on Vercel:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add `OPENAI_API_KEY` with your OpenAI API key value
4. Redeploy your application

## Database Migrations

Run the following migrations to add the required database schema:

1. **009_add_listing_fields_to_books.sql**: Adds `isbn`, `edition`, `condition_text`, `description`, and `tags` columns to the books table
2. **010_create_profiles_table.sql**: Creates the profiles table with Pro status and AI usage tracking

To apply migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL files in your Supabase dashboard
```

## Features

### Seller Enhancement

Pro sellers can enhance their listings when creating or editing:

1. Fill in book details (ISBN, edition, condition text)
2. Click "Enhance with AI" button
3. Review AI-generated suggestions:
   - Optimized title
   - Optimized description (300-500 characters)
   - Key feature bullet points (5-8 items)
   - Search keywords (10-15 items)
   - Suggested price range
4. Apply individual suggestions or regenerate

### Buyer Insights

Pro buyers can get AI insights on any listing:

1. Navigate to listing detail page
2. Click "Get AI Insights" button
3. View:
   - Condition summary
   - Fair price range
   - Key insights about the listing

### Rate Limiting

- Pro users: 20 enhancements per day
- Counter resets every 24 hours
- Remaining count displayed in UI
- Non-Pro users see upgrade prompts

## Security

- All OpenAI API calls are made server-side only (via server actions)
- Pro status verified on every request
- Rate limiting enforced at database level
- Row Level Security (RLS) policies protect user data

## Model Used

- **Model**: `gpt-4o-mini` (cost-effective, fast)
- **Response Format**: JSON (structured output)
- **Temperature**: 0.7 (balanced creativity/consistency)

## Error Handling

The system handles:
- Missing API key
- Invalid Pro subscription
- Rate limit exceeded
- OpenAI API errors
- Network failures

All errors are displayed to users with helpful messages.

## Testing

To test the feature:

1. Ensure you have a Pro subscription
2. Create or edit a listing
3. Fill in condition text (required for enhancement)
4. Click "Enhance with AI"
5. Verify suggestions appear and can be applied

## Troubleshooting

### "OpenAI API key not configured"
- Check `.env.local` has `OPENAI_API_KEY` set
- Restart your development server after adding the key
- Verify the key is correct in Vercel (for production)

### "Pro subscription required"
- Verify your subscription is active in the subscriptions table
- Check that `is_pro` is synced in profiles table
- Ensure subscription status is 'active' or 'trialing'

### "Daily limit reached"
- Wait 24 hours for reset
- Check `last_reset` timestamp in profiles table
- Counter resets automatically when 24 hours have passed

## Cost Considerations

- `gpt-4o-mini` is cost-effective (~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
- Average enhancement uses ~500-1000 tokens
- With 20 uses/day limit, estimated cost: ~$0.01-0.02 per user per day
- Monitor usage in OpenAI dashboard

## Future Enhancements

Potential improvements:
- Support for multiple languages
- Customizable enhancement styles
- Bulk enhancement for multiple listings
- Enhanced price suggestions based on market data
- Integration with book price APIs

