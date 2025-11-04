// lyrics-worker.js - Web Worker para processamento de letras

// Worker para operações pesadas que não devem bloquear a UI
self.addEventListener('message', function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'extractLyrics':
        result = extractLyrics(data);
        break;
        
      case 'processExport':
        result = processExport(data);
        break;
        
      case 'validateSongs':
        result = validateSongs(data);
        break;
        
      case 'generateFilename':
        result = generateFilename(data);
        break;
        
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    self.postMessage({
      id,
      type: 'success',
      result
    });
    
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error.message
    });
  }
});

// Extração inteligente de letras de texto HTML
function extractLyrics(htmlContent) {
  // Simula parser HTML básico no worker
  const textContent = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Busca por padrões de letras
  const lyricsPatterns = [
    /\[Verse[^\]]*\][\s\S]*?(?=\[|$)/gi,
    /\[Chorus[^\]]*\][\s\S]*?(?=\[|$)/gi,
    /\[Bridge[^\]]*\][\s\S]*?(?=\[|$)/gi,
    /\[Intro[^\]]*\][\s\S]*?(?=\[|$)/gi,
    /\[Outro[^\]]*\][\s\S]*?(?=\[|$)/gi
  ];
  
  let lyrics = '';
  const foundParts = new Set();
  
  lyricsPatterns.forEach(pattern => {
    const matches = textContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/\s+/g, ' ').trim();
        if (cleaned.length > 10 && !foundParts.has(cleaned)) {
          foundParts.add(cleaned);
          lyrics += cleaned + '\n\n';
        }
      });
    }
  });
  
  // Fallback: busca por texto longo com quebras de linha
  if (!lyrics && textContent.length > 100) {
    const lines = textContent.split('\n').filter(line => 
      line.trim().length > 5 && 
      !line.includes('Suno') && 
      !line.includes('©') &&
      !line.includes('http')
    );
    
    if (lines.length > 3) {
      lyrics = lines.join('\n');
    }
  }
  
  return {
    lyrics: lyrics.trim(),
    hasLyrics: lyrics.trim().length > 50,
    confidence: calculateLyricsConfidence(lyrics)
  };
}

// Calcula confiança de que o texto é uma letra
function calculateLyricsConfidence(text) {
  if (!text || text.length < 20) return 0;
  
  let score = 0;
  
  // Presença de estruturas típicas de música
  if (text.includes('[Verse')) score += 30;
  if (text.includes('[Chorus')) score += 30;
  if (text.includes('[Bridge')) score += 20;
  if (text.includes('[Intro')) score += 10;
  if (text.includes('[Outro')) score += 10;
  
  // Padrões de rima e repetição
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 4) score += 10;
  if (lines.length > 8) score += 10;
  
  // Penalidades
  if (text.includes('Suno')) score -= 20;
  if (text.includes('©')) score -= 15;
  if (text.includes('http')) score -= 25;
  if (text.includes('javascript')) score -= 30;
  
  return Math.max(0, Math.min(100, score));
}

// Processamento de export em batch
function processExport(songs) {
  const processed = [];
  const startTime = Date.now();
  
  songs.forEach((song, index) => {
    try {
      const processedSong = {
        ...song,
        processedAt: Date.now(),
        index,
        filename: generateFilename(song.title || `song-${index + 1}`),
        estimatedDuration: estimateDuration(song.title),
        genres: extractGenres(song.styles || ''),
        metadata: extractMetadata(song)
      };
      
      processed.push(processedSong);
      
      // Report progress every 10 items
      if (index % 10 === 0) {
        self.postMessage({
          type: 'progress',
          progress: index / songs.length,
          processed: index + 1,
          total: songs.length
        });
      }
      
    } catch (error) {
      processed.push({
        ...song,
        error: error.message,
        processedAt: Date.now(),
        index
      });
    }
  });
  
  const processingTime = Date.now() - startTime;
  
  return {
    songs: processed,
    stats: {
      total: songs.length,
      successful: processed.filter(s => !s.error).length,
      failed: processed.filter(s => s.error).length,
      processingTime
    }
  };
}

// Validação de músicas
function validateSongs(songs) {
  const results = {
    valid: [],
    invalid: [],
    duplicates: [],
    statistics: {
      totalSize: 0,
      avgTitleLength: 0,
      genreDistribution: new Map()
    }
  };
  
  const seenIds = new Set();
  const seenTitles = new Set();
  let totalTitleLength = 0;
  
  songs.forEach(song => {
    const issues = [];
    
    // Validação de ID
    if (!song.id || typeof song.id !== 'string') {
      issues.push('Invalid or missing ID');
    } else if (seenIds.has(song.id)) {
      results.duplicates.push({ ...song, reason: 'Duplicate ID' });
      return;
    }
    seenIds.add(song.id);
    
    // Validação de título
    if (!song.title || song.title.trim().length < 1) {
      issues.push('Missing or empty title');
    } else {
      const normalizedTitle = song.title.toLowerCase().trim();
      if (seenTitles.has(normalizedTitle)) {
        results.duplicates.push({ ...song, reason: 'Duplicate title' });
        return;
      }
      seenTitles.add(normalizedTitle);
      totalTitleLength += song.title.length;
    }
    
    // Validação de URL (se fornecida)
    if (song.url && !isValidSunoUrl(song.url)) {
      issues.push('Invalid Suno URL');
    }
    
    // Estatísticas
    const songSize = JSON.stringify(song).length;
    results.statistics.totalSize += songSize;
    
    if (song.genres) {
      song.genres.forEach(genre => {
        const count = results.statistics.genreDistribution.get(genre) || 0;
        results.statistics.genreDistribution.set(genre, count + 1);
      });
    }
    
    if (issues.length === 0) {
      results.valid.push(song);
    } else {
      results.invalid.push({ ...song, issues });
    }
  });
  
  results.statistics.avgTitleLength = totalTitleLength / songs.length;
  results.statistics.genreDistribution = Object.fromEntries(results.statistics.genreDistribution);
  
  return results;
}

// Geração de nome de arquivo otimizada
function generateFilename(title) {
  if (!title) return 'unknown-song.mp3';
  
  return title
    .replace(/\s*v\d+\.\d+\+?\s*$/i, '') // Remove version tags
    .replace(/[\/\\?%*:|"<>]/g, '-') // Replace invalid chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores
    .replace(/^_+|_+$/g, '') // Trim underscores
    .toLowerCase()
    .substring(0, 80) // Limit length
    + '.mp3';
}

// Estimativa de duração baseada no título (heurística)
function estimateDuration(title) {
  if (!title) return 180; // 3 minutos default
  
  // Palavras que sugerem músicas mais longas
  const longIndicators = ['extended', 'full', 'complete', 'epic', 'symphony'];
  const shortIndicators = ['intro', 'outro', 'interlude', 'snippet', 'short'];
  
  const lowerTitle = title.toLowerCase();
  
  if (longIndicators.some(word => lowerTitle.includes(word))) {
    return 300; // 5 minutos
  }
  
  if (shortIndicators.some(word => lowerTitle.includes(word))) {
    return 120; // 2 minutos
  }
  
  // Baseado no comprimento do título
  const baseTime = 180;
  const titleFactor = Math.min(title.length / 50, 1.5);
  
  return Math.round(baseTime * titleFactor);
}

// Extração de gêneros musicais do texto
function extractGenres(stylesText) {
  if (!stylesText) return [];
  
  const knownGenres = [
    'pop', 'rock', 'jazz', 'classical', 'electronic', 'hip hop', 'r&b', 'country',
    'folk', 'blues', 'reggae', 'punk', 'metal', 'disco', 'funk', 'soul',
    'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'ambient',
    'indie', 'alternative', 'grunge', 'ska', 'gospel', 'latin', 'world',
    'new age', 'experimental', 'minimal', 'trap', 'synthwave', 'chillout'
  ];
  
  const lowerStyles = stylesText.toLowerCase();
  const foundGenres = knownGenres.filter(genre => 
    lowerStyles.includes(genre)
  );
  
  return [...new Set(foundGenres)]; // Remove duplicates
}

// Extração de metadata adicional
function extractMetadata(song) {
  const metadata = {
    hasExplicitContent: false,
    language: 'unknown',
    mood: 'neutral',
    energy: 'medium',
    danceability: 'medium'
  };
  
  const title = (song.title || '').toLowerCase();
  const styles = (song.styles || '').toLowerCase();
  const combined = `${title} ${styles}`;
  
  // Detecção de conteúdo explícito
  const explicitWords = ['explicit', 'parental', 'nsfw', 'adult'];
  metadata.hasExplicitContent = explicitWords.some(word => combined.includes(word));
  
  // Detecção de idioma (básica)
  const languageIndicators = {
    english: ['english', 'en', 'uk', 'us'],
    spanish: ['spanish', 'español', 'es'],
    portuguese: ['portuguese', 'português', 'pt', 'brasil'],
    french: ['french', 'français', 'fr'],
    german: ['german', 'deutsch', 'de']
  };
  
  Object.entries(languageIndicators).forEach(([lang, indicators]) => {
    if (indicators.some(indicator => combined.includes(indicator))) {
      metadata.language = lang;
    }
  });
  
  // Detecção de mood
  const moodIndicators = {
    happy: ['happy', 'joy', 'cheerful', 'upbeat', 'bright'],
    sad: ['sad', 'melancholy', 'blue', 'depressed', 'sorrow'],
    energetic: ['energetic', 'pump', 'power', 'intense', 'driving'],
    calm: ['calm', 'peaceful', 'serene', 'gentle', 'soft'],
    dark: ['dark', 'gothic', 'heavy', 'aggressive', 'angry']
  };
  
  Object.entries(moodIndicators).forEach(([mood, indicators]) => {
    if (indicators.some(indicator => combined.includes(indicator))) {
      metadata.mood = mood;
    }
  });
  
  return metadata;
}

// Validação de URL do Suno
function isValidSunoUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('suno') && 
           parsed.protocol === 'https:' &&
           (parsed.pathname.includes('/song/') || parsed.pathname.includes('/track/'));
  } catch {
    return false;
  }
}

// Report de progresso
function reportProgress(current, total, message) {
  self.postMessage({
    type: 'progress',
    progress: current / total,
    current,
    total,
    message
  });
}