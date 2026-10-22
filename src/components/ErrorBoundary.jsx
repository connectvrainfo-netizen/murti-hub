import React from 'react';
import { Sparkles, RotateCcw, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error in Amol Murti Bhandar UI:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (typeof this.props.onReset === 'function') {
            this.props.onReset();
        } else {
            window.location.hash = '';
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#FDFBF7]">
                    <div className="max-w-md w-full bg-white rounded-3xl border border-[#E6D6B8] p-8 text-center shadow-lg space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#FAF5E8] border border-[#E6D6B8] flex items-center justify-center mx-auto text-[#C69722]">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="font-serif text-2xl font-bold text-[#161616]">
                            Sacred Idol View Refreshing
                        </h2>
                        <p className="text-xs text-stone-600 leading-relaxed">
                            A momentary disturbance occurred while loading the handcrafted idol details. Please return to the collection or refresh the view.
                        </p>
                        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-5 py-3 rounded-xl bg-[#161616] hover:bg-[#C69722] text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Collection</span>
                            </button>
                            <button
                                onClick={() => this.setState({ hasError: false })}
                                className="px-5 py-3 rounded-xl border border-stone-300 hover:border-black text-stone-700 text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Retry</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
