import api from "./api"; 

export const askChatbot = async (message: string, history: any[] = []) => {
  try {
    const response = await api.post("/api/Chatbot/ask", { 
        message: message,
        history: history 
    });

    return response.data;
  } catch (error) {
    console.error("Chatbot Service Error:", error);
    throw error; 
  }
};