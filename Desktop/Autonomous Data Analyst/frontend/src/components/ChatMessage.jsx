import React from 'react';
import Plot from 'react-plotly.js';

const ChatMessage = ({ message }) => {
    // Check role instead of sender
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
            <div
                className={`max-w-[90%] md:max-w-[75%] rounded-2xl p-5 ${isUser
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-blue-900/20'
                    : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none shadow-xl'
                    } shadow-lg transition-all duration-200`}
            >
                {/* Text Content */}
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {message.text}
                </div>

                {/* Interactive Plot */}
                {message.plot && (
                    <div className="mt-4 w-full h-72 md:h-96 bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 relative group">
                        <div className="absolute inset-0 bg-slate-800 animate-pulse -z-10" /> {/* Loading placeholder style */}
                        <Plot
                            data={message.plot.data}
                            layout={{
                                ...message.plot.layout,
                                width: undefined,
                                height: undefined,
                                autosize: true,
                                margin: { t: 40, r: 20, l: 50, b: 50 },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: {
                                    color: '#cbd5e1'
                                },
                                legend: {
                                    font: { color: '#cbd5e1' }
                                },
                                xaxis: {
                                    ...message.plot.layout?.xaxis,
                                    color: '#cbd5e1',
                                    gridcolor: '#334155'
                                },
                                yaxis: {
                                    ...message.plot.layout?.yaxis,
                                    color: '#cbd5e1',
                                    gridcolor: '#334155'
                                }
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                            config={{
                                responsive: true,
                                displaylogo: false,
                                modeBarButtonsToRemove: ['lasso2d', 'select2d']
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
