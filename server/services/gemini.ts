import { GoogleGenAI, Type } from '@google/genai';
import { CONFIG } from '../config.js';

let aiClient: GoogleGenAI | null = null;

/**
 * Lazily initialize the Google Gen AI client with appropriate safety measures
 */
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = CONFIG.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not defined. Falling back to structured local simulation mode.');
      throw new Error('GEMINI_API_KEY is required for enterprise AI agent execution.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AIAnalysisResult {
  category: 'Password Reset' | 'VPN' | 'Printer' | 'Software' | 'Network' | 'Email' | 'Access' | 'License' | 'Hardware' | 'Other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  solution: string;
  create_ticket: boolean;
  confidence: number;
}

/**
 * Analyzes the employee's issue using Google Gemini 3.5 Flash and returns structured JSON analysis.
 */
export async function analyzeEmployeeIssue(message: string): Promise<AIAnalysisResult> {
  try {
    const ai = getGeminiClient();

    const systemInstruction = `
You are the elite Level 1 AI IT Helpdesk Agent for AEX Enterprise. Your job is to classify employee IT issues, assess priority, provide helpful initial solutions, and determine if an official support ticket needs to be created.

Analyze the user's message and return a strictly validated JSON object.

Valid Categories:
- "Password Reset": Forgotten password, expired credentials, AD lockout.
- "VPN": Cisco, Pulse Secure, GlobalProtect connection problems, tokens, certificate issues.
- "Printer": Offline, jam, scanner, network queue issues.
- "Software": Install requests, application crashes, licensing, access issues.
- "Network": Weak WiFi, ethernet disconnect, speed, slow intranet.
- "Email": Outlook, mailbox quota, spam, server connection, archive.
- "Access": Sharepoint permissions, folder share, credentials.
- "License": Adobe, Office 365, JetBrains activation key or renewal.
- "Hardware": Laptop slow, screen flicker, replacement peripheral, battery swelling.
- "Other": Standard requests not covered above.

Prioritization Guidelines:
- "low": Localized issues with workarounds (e.g. single printer error, cosmetic software requests).
- "medium": Single employee blocked from a specific task (e.g. application crash, printer offline for an individual).
- "high": Multiple employees affected or a single employee completely unable to work (e.g. VPN down, primary laptop hardware failure, email sending broken).
- "critical": Entire office or site blocked, security breech, major server or network outage.

Ticket Decision:
- Set "create_ticket" to true if the issue is a physical hardware fault, AD lockout, security alert, requires human intervention (e.g., license purchase, manual folder share), or if the initial troubleshooting is unlikely to be solved on the spot by the user.
- Set "create_ticket" to false for simple troubleshooting issues (e.g. how-to questions, standard software download links).

Provide a concise, professional, and clear troubleshooting instruction in the "solution" field, styled as a direct, polite response to the employee.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'The classified IT category of the problem.',
              enum: ['Password Reset', 'VPN', 'Printer', 'Software', 'Network', 'Email', 'Access', 'License', 'Hardware', 'Other'],
            },
            priority: {
              type: Type.STRING,
              description: 'Estimated urgency of the issue.',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            solution: {
              type: Type.STRING,
              description: 'Initial advice, steps, or explanation offered to the employee.',
            },
            create_ticket: {
              type: Type.BOOLEAN,
              description: 'Whether a human support ticket must be raised for full resolution.',
            },
            confidence: {
              type: Type.INTEGER,
              description: 'Confidence percentage from 0 to 100.',
            },
          },
          required: ['category', 'priority', 'solution', 'create_ticket', 'confidence'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      category: parsed.category || 'Other',
      priority: parsed.priority || 'medium',
      solution: parsed.solution || 'Our IT operations have received your request. We will analyze the situation and follow up shortly.',
      create_ticket: typeof parsed.create_ticket === 'boolean' ? parsed.create_ticket : true,
      confidence: parsed.confidence || 85,
    };
  } catch (error) {
    console.error('Gemini API execution error, executing local heuristic analyzer:', error);
    return getLocalHeuristicAnalysis(message);
  }
}

/**
 * Fallback heuristic classifier when Gemini key is missing or encounters a rate limit / error
 */
function getLocalHeuristicAnalysis(message: string): AIAnalysisResult {
  const msgLower = message.toLowerCase();
  let category: AIAnalysisResult['category'] = 'Other';
  let priority: AIAnalysisResult['priority'] = 'medium';
  let solution = 'I have identified your concern. To solve this immediately, please try restarting your device or checking your active connection. A support ticket is being opened for further technician analysis.';
  let create_ticket = true;

  if (msgLower.includes('password') || msgLower.includes('pwd') || msgLower.includes('lock') || msgLower.includes('sign in') || msgLower.includes('login')) {
    category = 'Password Reset';
    priority = 'medium';
    solution = 'To recover your account password, navigate to our Self-Service Identity Portal (https://sso.aex.com/recovery). If you are fully locked out of your Active Directory profile, please contact our helpline or allow this ticket to route to our directory services team.';
    create_ticket = msgLower.includes('locked');
  } else if (msgLower.includes('vpn') || msgLower.includes('pulse') || msgLower.includes('globalprotect') || msgLower.includes('tunnel')) {
    category = 'VPN';
    priority = 'high';
    solution = 'VPN connectivity issues are frequently caused by stale network routes. Please disconnect, flush your DNS (ipconfig /flushdns), and connect using the alternate EU/US portal gateway.';
  } else if (msgLower.includes('printer') || msgLower.includes('toner') || msgLower.includes('jam') || msgLower.includes('printing')) {
    category = 'Printer';
    priority = 'low';
    solution = 'Verify if the printer is connected to the AEX Secure Office Wi-Fi network and checks out on your workstation queues. For physical malfunctions (error codes, jams), please confirm the offline status and our physical support team will be scheduled.';
  } else if (msgLower.includes('wifi') || msgLower.includes('internet') || msgLower.includes('network') || msgLower.includes('slow') || msgLower.includes('intranet')) {
    category = 'Network';
    priority = 'high';
    solution = 'Please confirm if you are on the "AEX-Corp-Secure" SSID or Ethernet connection. Try toggling your network adapter off and on. If you are experiencing office-wide outages, please alert your local floor lead.';
  } else if (msgLower.includes('license') || msgLower.includes('activation') || msgLower.includes('adobe') || msgLower.includes('product key') || msgLower.includes('office 365')) {
    category = 'License';
    priority = 'low';
    solution = 'Enterprise subscription licenses can be requested through the AEX Software Hub. Ensure you specify your department manager billing code so the license procurement can be automated.';
  } else if (msgLower.includes('laptop') || msgLower.includes('hardware') || msgLower.includes('battery') || msgLower.includes('screen') || msgLower.includes('keyboard')) {
    category = 'Hardware';
    priority = 'medium';
    solution = 'Physical device issues require direct inspection. Please backup your critical user data directories. We have initiated a hardware repair ticket and our technical depot staff will contact you with a time slot.';
  }

  return {
    category,
    priority,
    solution,
    create_ticket,
    confidence: 70,
  };
}
