const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');

// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const client = new Anthropic();

app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Investment agent endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { action, data } = req.body;

    const systemPrompt = `You are an expert investment advisor analyzing portfolios and investment options.
You help users make informed decisions about their 500,000 NIS portfolio.
Provide clear analysis with specific recommendations, risk assessments, and comparative data.
Always consider liquidity needs, diversification, and Israeli market conditions.`;

    const userMessage = buildPrompt(action, data);

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    res.json({
      success: true,
      analysis: message.content[0].text
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Portfolio comparison endpoint
app.post('/api/compare', async (req, res) => {
  try {
    const { options } = req.body;

    const systemPrompt = `You are comparing investment options for a 500,000 NIS portfolio.
Analyze each option's risk, return potential, liquidity, and suitability.
Format your response as a clear comparison table mentally, then explain trade-offs.`;

    const userMessage = `Compare these investment options:\n${JSON.stringify(options, null, 2)}`;

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    res.json({
      success: true,
      comparison: message.content[0].text
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scenario testing endpoint
app.post('/api/scenario', async (req, res) => {
  try {
    const { scenario, portfolio } = req.body;

    const systemPrompt = `You are stress-testing an investment portfolio for different market scenarios.
Analyze how the portfolio would perform under various conditions.
Provide specific impact estimates and recommendations for risk mitigation.`;

    const userMessage = `Portfolio: ${JSON.stringify(portfolio)}\nScenario: ${scenario}\nAnalyze the impact and provide recommendations.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    res.json({
      success: true,
      analysis: message.content[0].text
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function buildPrompt(action, data) {
  switch(action) {
    case 'compare':
      return `I want to compare these investment options for my 500,000 NIS portfolio: ${JSON.stringify(data)}. Which is best for my needs?`;
    case 'allocate':
      return `Help me allocate 500,000 NIS across: ${JSON.stringify(data)}. I need some liquidity but want solid long-term growth.`;
    case 'risk':
      return `Assess the risk level of this portfolio: ${JSON.stringify(data)}. What's my exposure and what should I adjust?`;
    default:
      return `Analyze my investment situation: ${JSON.stringify(data)}`;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Investment Agent running on port ${PORT}`);
});
