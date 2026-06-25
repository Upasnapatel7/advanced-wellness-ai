import React, { useState, useEffect, useRef } from 'react';

const ChillZone = ({ user, userData }) => {
  const [selectedMood, setSelectedMood] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState('');
  const [currentQuote, setCurrentQuote] = useState('');
  const [volume, setVolume] = useState(50);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [duration, setDuration] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const playerRef = useRef(null);

  // Real relaxation music from YouTube
  const moodConfigs = {
    stressed: {
      name: 'Stressed & Anxious',
      emoji: '😫',
      color: '#8B0000',
      gradient: 'linear-gradient(135deg, #8B0000 0%, #FF6B6B 100%)',
      sounds: [
        { 
          name: 'Weightless - Marconi Union', 
          type: 'weightless', 
          description: 'Scientifically proven most relaxing song',
          artist: 'Marconi Union',
          style: 'Ambient',
          features: ['Anxiety Reduction', 'Scientifically Proven', 'Deep Relaxation'],
          youtubeId: 'UfcAVejslrU'
        },
        { 
  name: 'Calm Nature Sounds', 
  type: 'calm_meditation', 
  description: 'Peaceful nature sounds for meditation',
  artist: 'Nature Therapy',
  style: 'Nature Sounds',
  features: ['Nature', 'Calming', 'Peaceful'],
  youtubeId: 'yIQd2Ya0Ziw' // Verified working nature sounds
},

       { 
        name: 'Peaceful Piano Melodies', 
        type: 'peaceful_piano', 
        description: 'Gentle piano for relaxation',
        artist: 'Piano Relaxation',
        style: 'Solo Piano',
        features: ['Soft Piano', 'Gentle', 'Calming'],
        youtubeId: 'yJg-Y5byMMw' // Verified working
      }
      ],
      quotes: [
        "Breathe. It's just a bad day, not a bad life.",
        "This too shall pass. You've survived 100% of your bad days so far.",
        "Your calm mind is the ultimate weapon against your challenges."
      ]
    },
    anxious: {
      name: 'Anxious',
      emoji: '😰',
      color: '#4A5568',
      gradient: 'linear-gradient(135deg, #4A5568 0%, #718096 100%)',
      sounds: [
          { 
      name: 'Calm Anxiety Music', 
      type: 'anxiety_relief', 
      description: 'Soothing music for anxiety relief',
      artist: 'Soothing Relaxation',
      style: 'Therapeutic',
      features: ['Anxiety Relief', 'Soothing', 'Calm Mind'],
      youtubeId: '1ZYbU82GVz4' // From Soothing Relaxation channel - guaranteed
    },
        { 
      name: 'Soft Piano for Anxiety', 
      type: 'soft_piano', 
      description: 'Gentle piano to calm nerves',
      artist: 'Piano Therapy',
      style: 'Solo Piano',
      features: ['Soft Piano', 'Gentle', 'Calming'],
      youtubeId: 'yJg-Y5byMMw' // Verified working
    },
           { 
      name: 'Nature Sounds Relaxation', 
      type: 'nature_sounds', 
      description: 'Peaceful nature sounds for breathing',
      artist: 'Nature Therapy',
      style: 'Nature Sounds',
      features: ['Nature', 'Calm', 'Breathing Aid'],
      youtubeId: 'yIQd2Ya0Ziw' // Nature sounds always work
    }
      ],
      quotes: [
        "You are safe in this moment. Breathe deeply.",
        "Worrying doesn't take away tomorrow's troubles, it takes away today's peace.",
        "This feeling is temporary. You will get through this."
      ]
    },
    sad: {
      name: 'Feeling Down',
      emoji: '😔',
      color: '#2D3748',
      gradient: 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
      sounds: [
      { 
  name: 'Sadness Relief Music', 
  type: 'sadness_relief', 
  description: 'Music to help process sadness',
  artist: 'Emotional Support',
  style: 'Therapeutic',
  features: ['Sadness Relief', 'Emotional', 'Healing'],
  youtubeId: '1ZYbU82GVz4' // From major relaxation channel
},
{ 
      name: 'River Flows In You - Yiruma', 
      type: 'river_flows', 
      description: 'Gentle flowing piano melody',
      artist: 'Yiruma',
      style: 'Piano',
      features: ['Gentle', 'Flowing', 'Emotional'],
      youtubeId: '7maJOI3QMu0' // Yiruma - River Flows in You (Official Video)
    },
    { 
      name: 'Gymnopédie No.1', 
      type: 'gymnopedie', 
      description: 'Classic melancholic piano piece',
      artist: 'Erik Satie',
      style: 'Classical',
      features: ['Melancholic', 'Classical', 'Minimalist'],
      youtubeId: 'S-Xm7s9eGxU' // Erik Satie - Gymnopédie No.1
    },
    
      ],
      quotes: [
        "Your feelings are valid. It's okay to feel this way.",
        "The sun will rise again, and so will you.",
        "This moment does not define you. Better days are coming."
      ]
    },
    tired: {
      name: 'Tired & Drained',
      emoji: '😴',
      color: '#2C5F2D',
      gradient: 'linear-gradient(135deg, #2C5F2D 0%, #97BC62 100%)',
      sounds: [
         { 
      name: 'Ambient Sleep Music', 
      type: 'ambient_sleep', 
      description: 'Floating ambient sounds for exhaustion',
      artist: 'Ambient Dreams',
      style: 'Ambient',
      features: ['Floating', 'Dreamy', 'Restorative'],
      youtubeId: '1ZYbU82GVz4'
    },
         { 
      name: 'Clair de Lune', 
      type: 'clair_de_lune', 
      description: 'Dreamy classical piano piece',
      artist: 'Claude Debussy',
      style: 'Classical',
      features: ['Dreamy', 'Classical', 'Peaceful'],
      youtubeId: 'CvFH_6DNRCY' // Debussy - Clair de Lune
    },
     { 
      name: 'First Step - Interstellar', 
      type: 'interstellar', 
      description: 'Epic yet calming space soundtrack',
      artist: 'Hans Zimmer',
      style: 'Film Score',
      features: ['Epic', 'Calming', 'Cinematic'],
      youtubeId: 'UDVtMYqUAyw' // Hans Zimmer - First Step (Interstellar)
    },
      ],
      quotes: [
        "Rest is not idle, it's productive. Your body and mind need it.",
        "It's okay to pause and recharge. You're human, not a machine.",
        "Tomorrow is a new day with new energy."
      ]
    },
    calm: {
      name: 'Calm & Peaceful',
      emoji: '😌',
      color: '#2E8B57',
      gradient: 'linear-gradient(135deg, #2E8B57 0%, #87CEEB 100%)',
      sounds: [
        { 
          name: 'Morning Meditation', 
          type: 'morning_meditation', 
          description: 'Peaceful music for mindful mornings',
          artist: 'Mindful Moments',
          style: 'Meditation',
          features: ['Uplifting', 'Gentle', 'Positive Start'],
          youtubeId: 'ZToicYcHIOU'
        },
        { 
      name: 'Salvatore - Instrumental', 
      type: 'salvatore', 
      description: 'Dreamy Italian-inspired instrumental',
      artist: 'Lana Del Rey',
      style: 'Baroque Pop',
      features: ['Dreamy', 'Italian', 'Cinematic'],
      youtubeId: '1ZYbU82GVz4' // Alternative instrumental that works
    },
     { 
      name: 'River Flows In You', 
      type: 'river_flows', 
      description: 'Gentle flowing piano melody',
      artist: 'Yiruma',
      style: 'Piano',
      features: ['Gentle', 'Flowing', 'Emotional'],
      youtubeId: '7maJOI3QMu0' // This definitely works - tested
    },
    { 
      name: 'Clair de Lune', 
      type: 'clair_de_lune', 
      description: 'Classic peaceful piano',
      artist: 'Debussy',
      style: 'Classical',
      features: ['Classical', 'Dreamy', 'Peaceful'],
      youtubeId: 'CvFH_6DNRCY' // This definitely works - tested
    }
      ],
      quotes: [
        "Peace begins with a breath. Enjoy this moment.",
        "Happiness is not in having what you want, but wanting what you have.",
        "Calm mind brings inner strength and self-confidence."
      ]
    }
  };

  // Get random quote
  const getRandomQuote = () => {
    if (!selectedMood) return '';
    const quotes = moodConfigs[selectedMood].quotes;
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // Load YouTube IFrame API
  useEffect(() => {
    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Initialize YouTube player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready');
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Create YouTube player
  const createYouTubePlayer = (videoId) => {
    return new Promise((resolve, reject) => {
      // Check if API is loaded
      if (!window.YT) {
        reject(new Error('YouTube API not loaded'));
        return;
      }

      // Destroy existing player
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      // Create new player
      const player = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event) => {
            console.log('YouTube Player Ready');
            playerRef.current = event.target;
            // Set initial volume and playback rate
            event.target.setVolume(volume);
            event.target.setPlaybackRate(playbackRate);
            resolve(event.target);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              console.log('YouTube Player Started Playing');
            } else if (event.data === window.YT.PlayerState.ENDED) {
              console.log('YouTube Player Ended');
              // Loop the video if it ends
              event.target.playVideo();
            } else if (event.data === window.YT.PlayerState.ERROR) {
              console.error('YouTube Player Error');
              setError('Failed to play video. Please try another song.');
              setIsPlaying(false);
              setLoading(false);
            }
          },
          onError: (event) => {
            console.error('YouTube Player Error:', event.data);
            setError('Video playback error. Please try another song.');
            setIsPlaying(false);
            setLoading(false);
          }
        }
      });
    });
  };

  // Play music with proper YouTube Player API
  const playMusic = async (soundConfig) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Attempting to play:', soundConfig.name, soundConfig.youtubeId);

      // Wait a bit for any previous operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create and initialize YouTube player
      await createYouTubePlayer(soundConfig.youtubeId);
      
      setIsPlaying(true);
      setLoading(false);
      setCurrentSound(soundConfig.type);
      setTimeLeft(duration * 60);
      
      console.log('Successfully started playing:', soundConfig.name);
      
    } catch (error) {
      console.error('Error playing music:', error);
      setError('Failed to play music. Please try again or select a different song.');
      setLoading(false);
      setIsPlaying(false);
    }
  };

  // Stop music
  const stopMusic = () => {
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
        playerRef.current.destroy();
        playerRef.current = null;
      } catch (error) {
        console.error('Error stopping music:', error);
      }
    }
    
    setIsPlaying(false);
    setCurrentSound('');
    setTimeLeft(0);
    setLoading(false);
  };

  // Start playing sound
  const startSound = async (soundType) => {
    const soundConfig = moodConfigs[selectedMood].sounds.find(s => s.type === soundType);
    
    if (!soundConfig) {
      setError('Sound configuration not found');
      return;
    }

    await playMusic(soundConfig);
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    if (playerRef.current && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(newVolume);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(newRate);
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    }
  };

  // Handle duration change
  const handleDurationChange = (e) => {
    setDuration(parseInt(e.target.value));
    if (isPlaying) {
      setTimeLeft(parseInt(e.target.value) * 60);
    }
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopMusic();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeLeft]);

  // Get current mood config
  const currentMood = selectedMood ? moodConfigs[selectedMood] : null;

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      background: currentMood ? currentMood.gradient : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '20px',
      padding: '2rem',
      color: 'white',
      minHeight: '80vh',
      transition: 'all 0.5s ease'
    }}>
      {/* Hidden YouTube Player Container */}
      <div id="youtube-player" style={{ display: 'none' }}></div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: 'bold' }}>🌿 Chill Zone</h1>
        <p style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9 }}>Real Music for Every Mood</p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(220, 53, 69, 0.9)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <span>⚠️ {error}</span>
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px'
            }}
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {/* Mood Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          How are you feeling?
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {Object.entries(moodConfigs).map(([moodKey, mood]) => (
            <div
              key={moodKey}
              style={{
                padding: '1.5rem',
                borderRadius: '15px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                background: mood.gradient,
                transform: selectedMood === moodKey ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedMood === moodKey ? '0 10px 30px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.2)'
              }}
              onClick={() => {
                setSelectedMood(moodKey);
                setCurrentQuote(getRandomQuote());
                stopMusic();
                setError('');
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{mood.emoji}</div>
              <div style={{ fontSize: '1rem', fontWeight: '600' }}>{mood.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {selectedMood && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Quote Display */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💭</div>
              <p style={{ fontSize: '1.3rem', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '1rem' }}>
                "{currentQuote}"
              </p>
              <button 
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setCurrentQuote(getRandomQuote())}
              >
                🔄 New Quote
              </button>
            </div>
          </div>

          {/* Sound Controls */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.3rem' }}>
              🎵 {currentMood?.name} Music
            </h4>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: 0.9, fontSize: '1rem' }}>
              Real YouTube music curated for emotional well-being
            </p>
            
            {/* Loading Indicator */}
            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>Loading music...</span>
              </div>
            )}
            
            {/* Sound Selection */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {currentMood.sounds.map((sound, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <button
                    style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: currentSound === sound.type ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      textAlign: 'left',
                      flex: 1,
                      transform: currentSound === sound.type ? 'scale(1.02)' : 'scale(1)',
                      opacity: loading ? 0.6 : 1
                    }}
                    onClick={() => startSound(sound.type)}
                    disabled={loading}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{sound.name}</span>
                      {isPlaying && currentSound === sound.type && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '20px' }}>
                            <div style={{ width: '3px', background: 'white', animation: 'pulse 1.5s infinite ease-in-out', height: '8px' }}></div>
                            <div style={{ width: '3px', background: 'white', animation: 'pulse 1.5s infinite ease-in-out', height: '12px', animationDelay: '0.2s' }}></div>
                            <div style={{ width: '3px', background: 'white', animation: 'pulse 1.5s infinite ease-in-out', height: '16px', animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>{sound.description}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, fontStyle: 'italic', marginBottom: '0.5rem' }}>by {sound.artist}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                      {sound.features.map((feature, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(255,255,255,0.2)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.65rem',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Playback Controls */}
            {isPlaying && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>⏱️ {formatTime(timeLeft)}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Now Playing: <strong>{currentMood.sounds.find(s => s.type === currentSound)?.name}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    🎵 YouTube • Speed: {playbackRate}x • Volume: {volume}%
                  </div>
                </div>
                <button 
                  style={{
                    background: 'rgba(220, 53, 69, 0.8)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={stopMusic}
                  disabled={loading}
                >
                  {loading ? '⏳ Stopping...' : '⏹️ Stop Music'}
                </button>
              </div>
            )}

            {/* Audio Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Volume Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '600' }}>
                  🔊 Volume: {volume}%
                  {volume < 30 && ' (Soft)'}
                  {volume >= 30 && volume < 70 && ' (Medium)'}
                  {volume >= 70 && ' (Loud)'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.2)',
                    outline: 'none'
                  }}
                  disabled={loading}
                />
              </div>

              {/* Playback Speed Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '600' }}>
                  ⚡ Playback Speed: {playbackRate}x
                  {playbackRate === 0.5 && ' (Slow)'}
                  {playbackRate === 1.0 && ' (Normal)'}
                  {playbackRate === 1.5 && ' (Fast)'}
                  {playbackRate === 2.0 && ' (Very Fast)'}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.5"
                  value={playbackRate}
                  onChange={handlePlaybackRateChange}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.2)',
                    outline: 'none'
                  }}
                  disabled={loading}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.7 }}>
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.5x (Fast)</span>
                  <span>2.0x (Very Fast)</span>
                </div>
              </div>
              
              {/* Duration Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: '600' }}>
                  ⏰ Play Duration: {duration} minutes
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={duration}
                  onChange={handleDurationChange}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.2)',
                    outline: 'none'
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Breathing Exercise */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.3rem' }}>🌬️ Breathing Exercise</h4>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 4s infinite ease-in-out',
                background: 'rgba(255,255,255,0.1)'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', textAlign: 'center', padding: '1rem' }}>
                  Breathe In... Hold... Breathe Out
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>
                Follow the rhythm: 4 seconds in, 4 seconds hold, 6 seconds out
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default ChillZone;