const makeId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const readStore = (name) => {
  try {
    return JSON.parse(localStorage.getItem(`jworden_${name}`) || "[]");
  } catch {
    return [];
  }
};

const writeStore = (name, rows) => {
  try {
    localStorage.setItem(`jworden_${name}`, JSON.stringify(rows));
  } catch {
    // Ignore storage failures so the public site never crashes.
  }
};

const makeEntity = (name) => ({
  async list() {
    return readStore(name);
  },
  async filter(criteria = {}) {
    const rows = readStore(name);
    return rows.filter((row) =>
      Object.entries(criteria).every(([key, value]) => row?.[key] === value)
    );
  },
  async get(id) {
    return readStore(name).find((row) => row.id === id) || null;
  },
  async create(payload = {}) {
    const rows = readStore(name);
    const row = {
      id: makeId(),
      created_date: new Date().toISOString(),
      ...payload
    };
    rows.unshift(row);
    writeStore(name, rows);
    return row;
  },
  async update(id, payload = {}) {
    const rows = readStore(name);
    const updated = rows.map((row) => (row.id === id ? { ...row, ...payload } : row));
    writeStore(name, updated);
    return updated.find((row) => row.id === id) || null;
  },
  async delete(id) {
    writeStore(name, readStore(name).filter((row) => row.id !== id));
    return { success: true };
  }
});

const fallbackReviews = {
  configured: false,
  rating: 5,
  total: 0,
  reviews: [],
  mapsUri: "https://www.google.com/search?q=J.+Worden+%26+Sons+Paving"
};

const functionHandlers = {
  async fetchGoogleReviews() {
    return { data: fallbackReviews };
  },
  async analyzeDrivewayPhoto() {
    return {
      data: {
        summary: "Photo analysis is disabled in this standalone Netlify build until an AI backend is connected.",
        recommendation: "Call 804-446-1296 for a field review.",
        pci_score: null
      }
    };
  },
  async generateInstantQuotePdf() {
    return { data: { success: false, message: "PDF generation requires backend reconnection." } };
  },
  async generateProposalPDF() {
    return { data: { success: false, message: "Proposal generation requires backend reconnection." } };
  },
  async submitReferral(payload) {
    const referral = await base44.entities.Referral.create(payload);
    return { data: referral };
  },
  async checkWeatherForJobs() {
    return { data: { configured: false, alerts: [] } };
  }
};

export const base44 = {
  auth: {
    async me() {
      throw new Error("Standalone build has no Base44 auth session.");
    },
    logout() {
      return null;
    },
    redirectToLogin() {
      alert("Admin login is disabled in this standalone Netlify build.");
    }
  },
  entities: {
    AppSettings: makeEntity("AppSettings"),
    BeforeAfter: makeEntity("BeforeAfter"),
    BlogPost: makeEntity("BlogPost"),
    CaseStudy: makeEntity("CaseStudy"),
    Job: makeEntity("Job"),
    Lead: makeEntity("Lead"),
    LeadCommunication: makeEntity("LeadCommunication"),
    Project: makeEntity("Project"),
    ProjectDocument: makeEntity("ProjectDocument"),
    Referral: makeEntity("Referral"),
    SyncState: makeEntity("SyncState"),
    User: makeEntity("User"),
    VoiceCall: makeEntity("VoiceCall")
  },
  functions: {
    async invoke(name, payload = {}) {
      if (functionHandlers[name]) return functionHandlers[name](payload);
      return { data: { success: false, message: `${name} is not connected in standalone mode.` } };
    }
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        return { file_url: URL.createObjectURL(file) };
      },
      async SendEmail() {
        return { success: false, message: "Email backend not connected." };
      },
      async InvokeLLM() {
        return { success: false, message: "AI backend not connected." };
      }
    }
  },
  agents: {
    async createConversation() {
      return { id: makeId(), messages: [] };
    },
    subscribeToConversation(_id, cb) {
      cb?.({ messages: [] });
      return () => null;
    },
    async addMessage() {
      return { success: true };
    }
  }
};
