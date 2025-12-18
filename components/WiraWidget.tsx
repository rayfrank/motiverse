"use client";

import { useState, useEffect } from "react";

export function WiraWidget() {
    const [open, setOpen] = useState(false);

    // OPTIONAL: if Convai gives you a <script> initializer instead of an iframe,
    // you can load it here when `open` becomes true.
    useEffect(() => {
        if (!open) return;

        // Example pattern (you'll replace this with Convai's actual script if needed):
        // const script = document.createElement("script");
        // script.src = "https://cdn.convai.com/your-widget.js";
        // script.async = true;
        // script.onload = () => {
        //   // @ts-ignore
        //   window.initConvaiWidget?.({
        //     containerId: "convai-wira-container",
        //     characterId: "YOUR_CHARACTER_ID",
        //   });
        // };
        // document.body.appendChild(script);
        //
        // return () => {
        //   // optional cleanup if Convai recommends any
        // };

    }, [open]);

    return (
        <>
            {/* Floating open/close button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full text-xs font-semibold border accent-border accent-bg hover:opacity-90 shadow-lg"
            >
                {open ? "Hide WIRA" : "Open WIRA"}
            </button>

            {/* Chat panel */}
            {open && (
                <div
                    className="fixed bottom-16 right-4 z-40 w-[380px] h-[520px] rounded-2xl shadow-2xl border border-red-900 overflow-hidden flex flex-col body-bg"
                >
                    {/* Header bar */}
                    <div className="px-3 py-2 border-b border-red-900 text-xs flex justify-between items-center panel-bg">
                        <div>
                            <p className="font-semibold">WIRA</p>
                            <p className="text-[10px] text-red-200">
                                Your Motiverse wellness guide
                            </p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-[11px] text-red-200 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Convai embed area */}
                    <div className="flex-1 bg-black">
                        {/* 
              👉👉 REPLACE THIS BLOCK WITH YOUR CONVAI EMBED 👈👈

              OPTION A — If Convai gives you an <iframe>:
              <iframe
                src="https://YOUR-CONVAI-EMBED-URL"
                className="w-full h-full"
                allow="microphone; camera; autoplay"
              />

              OPTION B — If Convai gives you a <div id="..."> + <script>:
              1) Put the <div> here:
                 <div id="convai-wira-container" className="w-full h-full" />
              2) Move the <script> initialization into the useEffect above
                 (use containerId 'convai-wira-container').

              OPTION C — If Convai gives you a React component:
              1) import it at the top:
                    import { ConvaiWidget } from "convai-react";
              2) Render it here:
                    <ConvaiWidget characterId="YOUR_CHARACTER_ID" />
            */}

                        {/* Placeholder until you paste Convai: */}
                        <div className="w-full h-full flex items-center justify-center text-xs text-red-200">
                            Convai WIRA widget goes here.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
