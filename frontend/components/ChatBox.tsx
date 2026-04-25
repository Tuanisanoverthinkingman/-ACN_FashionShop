"use client";

import { useState, useRef, useEffect } from "react";
import { askChatbot } from "@/services/chatbot-services";

interface Message {
    id: number;
    text: string;
    sender: "bot" | "user";
    products?: any[];
}

export default function ChatBox() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Xin chào! NovaStore có thể giúp gì cho bạn?",
            sender: "bot",
        },
    ]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        const newUserMsg: Message = { id: Date.now(), text, sender: "user" };

        const chatHistory = messages
            .filter(msg => msg.id !== 1)
            .map(msg => ({ role: msg.sender, text: msg.text }));

        setMessages((prev) => [...prev, newUserMsg]);
        setInputText("");

        const loadingId = Date.now() + 1;
        setMessages((prev) => [...prev, { id: loadingId, text: "NovaStore đang tìm kiếm sản phẩm cho bạn...", sender: "bot" }]);

        try {
            const data = await askChatbot(text, chatHistory);

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === loadingId
                        ? { ...msg, text: data.text, products: data.products }
                        : msg
                )
            );
        } catch (error) {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === loadingId
                        ? { ...msg, text: "Xin lỗi, hệ thống AI đang bận. Bạn vui lòng thử lại sau nhé!", sender: "bot" }
                        : msg
                )
            );
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-50 flex items-center justify-center"
            >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 animate-fade-in-up">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">N</div>
                    <div>
                        <h3 className="font-bold text-sm">NovaStore Support</h3>
                        <p className="text-xs text-blue-100 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online (AI)
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>

                        <div
                            className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === "user"
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                                }`}
                        >
                            {msg.text}
                        </div>

                        {msg.products && msg.products.length > 0 && (
                            <div className="mt-2 flex flex-col gap-2 w-[85%]">
                                {msg.products.map((p: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-lg p-2 flex gap-3 shadow-sm hover:shadow-md transition cursor-pointer">

                                        <div className="w-14 h-14 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-hidden flex flex-col justify-between">
                                            <p className="text-sm font-semibold text-gray-800 line-clamp-1" title={p.name}>{p.name}</p>

                                            <div className="flex justify-between items-end mt-1">
                                                <div>
                                                    <p className="text-[13px] font-bold text-red-600">
                                                        {p.price ? p.price.toLocaleString('vi-VN') + '₫' : 'Liên hệ'}
                                                    </p>
                                                    {p.color && <p className="text-[10px] text-gray-500">Màu: {p.color}</p>}
                                                </div>
                                                <button className="text-[10px] bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition">Mua ngay</button>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-2 bg-white flex gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar border-t border-gray-100">
                <button onClick={() => handleSend("Tìm áo thun")} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                    Tìm áo thun
                </button>
                <button onClick={() => handleSend("Tìm quần jean")} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                    Tìm quần jean
                </button>
            </div>

            <div className="p-3 bg-white flex gap-2 items-center border-t border-gray-100">
                <input
                    type="text"
                    placeholder="Nhập yêu cầu (VD: áo polo đen)..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
                />
                <button
                    onClick={() => handleSend(inputText)}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    );
}