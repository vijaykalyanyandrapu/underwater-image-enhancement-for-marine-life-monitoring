import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality, Type } from "@google/genai";

// FIX: Define an interface for detection objects to ensure type safety.
interface Detection {
    species: string;
    behavior: string;
}

// SVG Icons for UI Elements
const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h18M3 6h18M3 18h18" stroke="url(#wave-gradient)"/>
        <defs><linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#64ffda" /><stop offset="100%" stopColor="#3dd5f3" /></linearGradient></defs>
    </svg>
);
const UploadIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>;
const StartAnalysisIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"></path></svg>;
const StopIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 6h12v12H6z"></path></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>;
const AwaitingVideoIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></svg>;
const CameraIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9.4 11.5l1.6 1.6-4 4H19v-2.5l-3-3-3.6 3.6zM12 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4 5h3l2-2h6l2 2h3v14H4V5z"></path></svg>;
const PreprocessingIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.41 7.41L12 14.83l-1.41-1.41L12 12l5.41-5.41L19.41 7.41zM5.12 9.12L3.71 7.71 2.29 9.12 5.12 11.95 8 9.12 6.53 7.65 5.12 9.06zM12 5c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path></svg>;
const ObjectDetectionIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM9 9h6v6H9z"></path></svg>;
const SpeciesClassificationIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"></path></svg>;
const TrackingMovementIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"></path></svg>;
const BehaviorPatternIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z M11 16h2v-2h-2v2zm1-10c-1.3 0-2.42.81-2.83 2H8v2h2.17c.41 1.19 1.53 2 2.83 2s2.42-.81 2.83-2H18V8h-2.17C15.42 6.81 14.3 6 13 6z"></path></svg>;
const ReportGenerationIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>;
const ChevronDownIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>;

// Video Player Controls Icons
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const VolumeHighIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>;
const VolumeOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>;
const FullscreenIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>;
const FullscreenExitIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></svg>;

// FIX: Added types for component props to ensure type safety.
const CustomVideoPlayer = ({ src, detections = [] }: { src: string, detections?: Detection[] }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const speedMenuRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
    const controlsTimeoutRef = useRef<number | null>(null);
    
    const playbackRates = [0.5, 1, 1.5, 2];

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const handleMouseMove = () => {
        setIsControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = window.setTimeout(() => {
            if (isPlaying) {
                 setIsControlsVisible(false);
            }
        }, 3000);
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                handleMouseMove();
            } else {
                videoRef.current.pause();
                setIsControlsVisible(true);
                if(controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            }
        }
    };
    
    const handleProgress = () => {
        if(videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(videoRef.current) {
            const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = newTime;
            setProgress(parseFloat(e.target.value));
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if(videoRef.current) videoRef.current.volume = newVolume;
    };
    
    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            if (!isMuted) setVolume(0); else setVolume(videoRef.current.volume || 1);
        }
    };

    const handlePlaybackRateChange = (rate) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setIsSpeedMenuOpen(false);
        }
    };
    
    const toggleFullscreen = () => {
        if (!playerContainerRef.current) return;
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };
    
     useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const videoElement = videoRef.current;
        const playerContainer = playerContainerRef.current;
        if (!videoElement || !playerContainer) return;

        videoElement.play().catch(() => {});

        return () => {
            videoElement.pause();
        };
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
                setIsSpeedMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Static bounding box data for illustrative purposes
    const illustrativeBoxes = [
      { top: '10%', left: '40%', width: '55%', height: '25%' },
      { top: '38%', left: '35%', width: '50%', height: '20%' },
      { top: '60%', left: '30%', width: '60%', height: '35%' },
    ];

    return (
        <div 
            ref={playerContainerRef} 
            className="custom-video-player"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if(isPlaying) setIsControlsVisible(false) }}
        >
            <video
                ref={videoRef}
                src={src}
                onClick={togglePlayPause}
                onTimeUpdate={handleProgress}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setIsPlaying(false)}
                loop
                playsInline
                autoPlay
                muted
            />

            {detections.length > 0 && (
                <div className="detection-overlay">
                    {detections.slice(0, 3).map((detection, index) => (
                        <div key={index} className="bounding-box" style={illustrativeBoxes[index]}>
                            <div className="bounding-box-label">{detection.species}: {detection.behavior}</div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className={`controls-overlay ${isControlsVisible ? 'visible' : ''}`}>
                <div className="progress-bar-container">
                    <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="seek-bar"/>
                </div>
                <div className="controls">
                    <div className="controls-left">
                        <button onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                         <div className="volume-container">
                            <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeHighIcon />}</button>
                            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider"/>
                        </div>
                    </div>
                    <div className="controls-center">
                         <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <div className="controls-right">
                       <div className="speed-control-container" ref={speedMenuRef}>
                            <button onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}><SettingsIcon/></button>
                            {isSpeedMenuOpen && (
                                <div className="speed-menu">
                                    {playbackRates.map(rate => (
                                        <button key={rate} onClick={() => handlePlaybackRateChange(rate)} className={playbackRate === rate ? 'active' : ''}>
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                       <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>{isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// FIX: Typed the detections prop to fix type inference issues within the component.
const BehaviorChart = ({ detections = [] }: { detections?: Detection[] }) => {
    // FIX: Explicitly type the initial value of the `reduce` method. This helps TypeScript
    // correctly infer the return type of `reduce` as `{ [key: string]: number }`,
    // resolving downstream type errors where values were inferred as `unknown`.
    const behaviorCounts = detections.reduce((acc: { [key: string]: number }, { behavior }) => {
        acc[behavior] = (acc[behavior] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const maxCount = Math.max(...Object.values(behaviorCounts), 0);
    const numLabels = Math.min(maxCount, 5);
    const yAxisLabels = Array.from({ length: numLabels }, (_, i) => {
        if (numLabels <= 1) return maxCount;
        return Math.round(maxCount / (numLabels - 1) * i);
    }).reverse();
    if(yAxisLabels.length === 0) yAxisLabels.push(0);


    return (
        <div className="chart-container">
            <div className="y-axis">
                {yAxisLabels.map(label => <span key={label}>{label}</span>)}
            </div>
            <div className="chart-bars">
                {Object.entries(behaviorCounts).map(([behavior, count]) => (
                    <div className="bar-group" key={behavior}>
                        <div className="bar" style={{ height: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}></div>
                        <span className="bar-label">{behavior}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Workflow = ({ analysisComplete }) => {
    const workflowItems = [
        { icon: <CameraIcon />, text: "Underwater Video Collection" },
        { icon: <PreprocessingIcon />, text: "Preprocessing of Video Frames" },
        { icon: <ObjectDetectionIcon />, text: "Object Detection (CNN - YOLO/SSD)" },
        { icon: <SpeciesClassificationIcon />, text: "Species Classification" },
        { icon: <TrackingMovementIcon />, text: "Tracking Movement (Optical Flow / DeepSort)" },
        { icon: <BehaviorPatternIcon />, text: "Behavior Pattern Recognition (LSTM/RNN)" },
        { icon: <ReportGenerationIcon />, text: "Behavior Annotation & Report Generation" },
    ];

    return (
        <aside className="workflow-panel">
            <h2>Analysis Workflow</h2>
            <div className="workflow-list">
                {workflowItems.map((item, index) => (
                    <React.Fragment key={index}>
                        <div className={`workflow-item ${analysisComplete ? (index === workflowItems.length - 1 ? 'final' : 'completed') : ''}`}>
                            {item.icon}<span>{item.text}</span>
                        </div>
                        {index < workflowItems.length - 1 && <div className="workflow-separator"><ChevronDownIcon /></div>}
                    </React.Fragment>
                ))}
            </div>
        </aside>
    );
};


const App = () => {
    const [uploadedFile, setUploadedFile] = useState<{ data: string; mimeType: string; url: string; name: string; type: 'image' | 'video' } | null>(null);
    const [analysis, setAnalysis] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const isAnalysisCancelled = useRef<boolean>(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadedFile(null);
        setAnalysis(null);
        setError(null);

        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

        if (!fileType) {
            setError("Unsupported file type. Please upload a valid image or video file.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setUploadedFile({
                    data: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                    url: URL.createObjectURL(file),
                    name: file.name,
                    type: fileType,
                });
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleStopAnalysis = () => {
        isAnalysisCancelled.current = true;
        setIsLoading(false);
        setError("Analysis cancelled by user.");
    };

    const analyzeContent = async () => {
        if (!uploadedFile) {
            setError("Please upload a file first.");
            return;
        }
        
        isAnalysisCancelled.current = false;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            if (uploadedFile.type === 'video') {
                 const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: {
                        parts: [
                            {
                                inlineData: {
                                    data: uploadedFile.data,
                                    mimeType: uploadedFile.mimeType,
                                },
                            },
                            {
                                text: `Analyze this underwater video. Provide a detailed analysis in a JSON object with two keys: 
                                1. "sceneSummary": A concise paragraph describing the overall scene, environment, and the primary interactions.
                                2. "detections": An array of objects, where each object represents a detected behavior event. Each object should have two keys: "species" (the common name of the animal) and "behavior" (a short description of the action, e.g., "Social Interaction", "Foraging", "Swimming"). Provide at least 3 detection events.`,
                            },
                        ],
                    },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                sceneSummary: { type: Type.STRING },
                                detections: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            species: { type: Type.STRING },
                                            behavior: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                
                if (isAnalysisCancelled.current) return;

                if (response.text) {
                     try {
                        const parsedAnalysis = JSON.parse(response.text);
                        setAnalysis(parsedAnalysis);
                    } catch (jsonError) {
                        console.error("Failed to parse video analysis JSON:", jsonError);
                        setError("The model returned an invalid analysis format for the video. Please try again.");
                    }
                } else {
                    setError("The model did not return an analysis. Please try a different video.");
                }
            } else {
                // Image analysis can be added here if needed in the future
                setError("Image analysis is not supported in this view.");
            }
        } catch (e) {
            if (isAnalysisCancelled.current) return;
            console.error(e);
            setError(`An error occurred while analyzing the file. Please try again.`);
        } finally {
            if (!isAnalysisCancelled.current) {
                setIsLoading(false);
            }
        }
    };

    const handleDownload = async () => {
        if (!uploadedFile || !analysis) return;
        setIsDownloading(true);
        setError(null);

        try {
            const video = document.createElement('video');
            video.src = uploadedFile.url;
            video.muted = true;

            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error("Could not get canvas context");
            }

            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analyzed-${uploadedFile.name}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            recorder.start();

            const illustrativeBoxes = [
                { top: '10%', left: '40%', width: '55%', height: '25%' },
                { top: '38%', left: '35%', width: '50%', height: '20%' },
                { top: '60%', left: '30%', width: '60%', height: '35%' },
            ];

            const renderLoop = () => {
                if (video.paused || video.ended) {
                    return;
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                analysis.detections.slice(0, 3).forEach((detection, index) => {
                    const box = illustrativeBoxes[index];
                    const x = parseFloat(box.left) / 100 * canvas.width;
                    const y = parseFloat(box.top) / 100 * canvas.height;
                    const w = parseFloat(box.width) / 100 * canvas.width;
                    const h = parseFloat(box.height) / 100 * canvas.height;

                    ctx.strokeStyle = '#ff8c00';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = 'rgba(255, 140, 0, 0.5)';
                    ctx.shadowBlur = 10;
                    ctx.strokeRect(x, y, w, h);
                    ctx.shadowBlur = 0;
                    
                    const label = `${detection.species}: ${detection.behavior}`;
                    ctx.fillStyle = '#ff8c00';
                    ctx.font = 'bold 18px Roboto';
                    const textMetrics = ctx.measureText(label);
                    ctx.fillRect(x - 2, y - 24, textMetrics.width + 12, 24);
                    ctx.fillStyle = '#0d2a4c';
                    ctx.fillText(label, x + 4, y - 6);
                });
                requestAnimationFrame(renderLoop);
            };

            await new Promise<void>((resolve, reject) => {
                video.onended = () => {
                    recorder.stop();
                    resolve();
                };
                video.onerror = (e) => {
                    recorder.stop();
                    reject(new Error("Video playback error during rendering."));
                };
                
                video.currentTime = 0;
                video.play().then(() => {
                    requestAnimationFrame(renderLoop);
                }).catch(reject);
            });

        } catch (e) {
            console.error("Download failed:", e);
            setError("Failed to process and download the video. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="placeholder">
                     <div className="spinner" role="status" aria-live="polite"></div>
                     <p>Analyzing {uploadedFile?.type || 'content'}...</p>
                </div>
            );
        }
        
        if (error) {
            return <div className="placeholder"><div className="error-message">{error}</div></div>;
        }

        if (analysis && uploadedFile?.type === 'video') {
            return (
                 <div className="results-view">
                    <div className="video-results-container">
                         <CustomVideoPlayer 
                            src={uploadedFile.url} 
                            detections={analysis?.detections || []} 
                         />
                         <p className="video-filename">{uploadedFile.name}</p>
                    </div>
                    <div className="analysis-grid">
                        <div className="grid-col-1">
                             <div className="analysis-section">
                                <h2>Scene Summary</h2>
                                <p>{analysis.sceneSummary}</p>
                            </div>
                            <div className="analysis-section">
                                <h2>Detection Log</h2>
                                <div className="detection-log">
                                    {analysis.detections?.map((d, i) => (
                                        <div key={i} className="log-item">
                                            <span className="log-dot"></span>
                                            {d.species} - {d.behavior}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid-col-2">
                             <div className="analysis-section">
                                <h2>Behavior Frequency</h2>
                                <BehaviorChart detections={analysis.detections} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        
        if (uploadedFile) {
            return (
                <div className="preview-container">
                    {uploadedFile.type === 'image' ? (
                        <img src={uploadedFile.url} alt="Uploaded preview" />
                    ) : (
                        <CustomVideoPlayer src={uploadedFile.url} />
                    )}
                </div>
            );
        }

        return (
            <div className="placeholder">
                <AwaitingVideoIcon />
                <h2>Awaiting Video</h2>
                <p>Upload a video file to begin the automated behavior analysis process.</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <LogoIcon />
                <h1>Analysis of Marine Animals</h1>
            </header>
            <div className="controls-bar">
                 <label htmlFor="file-upload" className="control-button">
                    <UploadIcon /> Upload Video
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="video/mp4, video/quicktime, video/x-msvideo"
                    onChange={handleFileChange}
                />
                <div className="controls-group-right">
                   {isLoading ? (
                        <button className="control-button stop-button" onClick={handleStopAnalysis}>
                            <StopIcon /> Stop Analysis
                        </button>
                    ) : (
                        <button className="control-button" onClick={analyzeContent} disabled={!uploadedFile}>
                            <StartAnalysisIcon /> Start Analysis
                        </button>
                    )}

                    {analysis && !isLoading && (
                        <button className="control-button" onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? <div className="spinner-small"></div> : <DownloadIcon />}
                            <span>{isDownloading ? 'Processing...' : 'Download Video'}</span>
                        </button>
                    )}
                </div>
            </div>
            <main className="main-content">
                <Workflow analysisComplete={!!analysis} />
                <section className="content-panel">
                    {renderContent()}
                </section>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);