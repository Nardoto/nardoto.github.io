// Minimal, self-contained SRT merge module wired to UI controls in index.html
// - Parses multiple SRT files
// - Recalculates timestamps cumulatively so the result is one continuous timeline
// - Maintains order by filename (natural sort) unless user-selected order differs
// - Streams work in chunks to keep UI responsive and supports cancellation

(function () {
    const mergeBtn = document.getElementById('mergeSrtsBtn');
    const cancelBtn = document.getElementById('cancelMergeBtn');
    const filesInput = document.getElementById('srtFiles');
    const statusDiv = document.getElementById('mergeStatus');
    const previewDiv = document.getElementById('mergePreview');
    const orderSelect = document.getElementById('srtOrder');
    const fileNameInput = document.getElementById('fileName');

    if (!mergeBtn || !filesInput || !statusDiv) return;

    let cancelled = false;

    cancelBtn?.addEventListener('click', () => {
        cancelled = true;
        setStatus('Operação cancelada.');
        setWorking(false);
    });

    mergeBtn.addEventListener('click', async () => {
        const files = Array.from(filesInput.files || []);
        if (files.length === 0) {
            setStatus('Selecione ao menos um arquivo .srt.');
            return;
        }

        cancelled = false;
        setWorking(true);
        setStatus(`Lendo ${files.length} arquivo(s)...`);

        // Determine order: always natural numeric A→Z
        let orderedFiles = files.slice().sort(naturalFileComparator);

        // Preview the final order before merging
        setPreview(orderedFiles.map(f => f.name));

        try {
            const merged = await mergeFilesSequentially(orderedFiles, (progress) => {
                if (!cancelled) setStatus(progress);
            });
            if (cancelled) return;

            const outName = (fileNameInput && fileNameInput.value.trim()) || 'merged';
            downloadSrt(`${outName}.srt`, merged);
            setStatus(`Concluído. Arquivo gerado: ${outName}.srt`);
            
            // Limpar memória e resetar interface para nova junção
            clearMemoryAndReset();
        } catch (err) {
            console.error(err);
            setStatus('Erro ao juntar SRTs. Verifique os arquivos.');
        } finally {
            setWorking(false);
        }
    });

    function setWorking(isWorking) {
        mergeBtn.disabled = isWorking;
        if (cancelBtn) cancelBtn.disabled = !isWorking;
        filesInput.disabled = isWorking;
    }

    function setStatus(text) {
        statusDiv.textContent = text || '';
    }

    function setPreview(names) {
        if (!previewDiv) return;
        if (!names || names.length === 0) { previewDiv.textContent = ''; return; }
        previewDiv.textContent = `Ordem de junção (total ${names.length}):\n- ` + names.join('\n- ');
    }

    function naturalFileComparator(a, b) {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    }

    async function mergeFilesSequentially(fileList, onProgress) {
        // We will parse each file, retime cues by cumulativeOffset, and build output incrementally
        let cumulativeOffsetMs = 0;
        let globalIndex = 1;
        let outputParts = [];

        for (let i = 0; i < fileList.length; i++) {
            if (cancelled) return '';

            const file = fileList[i];
            onProgress?.(`Lendo: ${file.name} (${i + 1}/${fileList.length}) ...`);
            const text = await file.text();

            // Parse cues
            const cues = parseSrt(text);

            // Compute duration of this file to adjust offset for next file
            const fileDurationMs = getSrtDurationMs(cues);

            // Append cues retimed
            const chunk = buildSrtChunk(cues, cumulativeOffsetMs, globalIndex);
            outputParts.push(chunk.text);
            globalIndex = chunk.nextIndex;
            cumulativeOffsetMs += fileDurationMs;

            onProgress?.(`Processado: ${file.name}. Duração total: ${msToTimestamp(cumulativeOffsetMs)}.`);

            // Yield to UI between files
            await nextFrame();
            if (cancelled) return '';
        }

        return outputParts.join('\n');
    }

    function parseSrt(text) {
        // Normalize newlines
        const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        // Split on blank lines between blocks; tolerate extra blank lines
        const blocks = normalized
            .split(/\n{2,}/)
            .map(b => b.trim())
            .filter(b => b.length > 0);

        const cues = [];
        for (const block of blocks) {
            if (!block) continue;
            const lines = block.split('\n');
            if (lines.length < 2) continue;

            // Some SRTs have an index line first; if first line is a number, ignore it
            let idx = 0;
            if (/^\d+$/.test(lines[0].trim())) idx = 1;

            const timingLine = lines[idx] || '';
            const match = timingLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
            if (!match) continue;
            const start = match[1];
            const end = match[2];

            const textLines = lines.slice(idx + 1);
            const cueText = textLines.join('\n');
            cues.push({ startMs: timestampToMs(start), endMs: timestampToMs(end), text: cueText });
        }
        return cues;
    }

    function getSrtDurationMs(cues) {
        if (!cues.length) return 0;
        const lastEnd = cues[cues.length - 1].endMs;
        const firstStart = cues[0].startMs;
        if (lastEnd >= firstStart) return lastEnd - firstStart;
        // Fallback: sum durations
        return cues.reduce((sum, c) => sum + Math.max(0, c.endMs - c.startMs), 0);
    }

    function buildSrtChunk(cues, offsetMs, startingIndex) {
        let index = startingIndex;
        let lines = [];
        for (const cue of cues) {
            const start = msToTimestamp(cue.startMs + offsetMs);
            const end = msToTimestamp(cue.endMs + offsetMs);
            lines.push(String(index));
            lines.push(`${start} --> ${end}`);
            lines.push(cue.text);
            lines.push('');
            index += 1;
        }
        return { text: lines.join('\n'), nextIndex: index };
    }

    function timestampToMs(ts) {
        const m = ts.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (!m) return 0;
        const hh = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10);
        const ss = parseInt(m[3], 10);
        const ms = parseInt(m[4], 10);
        return ((hh * 3600 + mm * 60 + ss) * 1000) + ms;
    }

    function msToTimestamp(totalMs) {
        if (totalMs < 0) totalMs = 0;
        const hh = Math.floor(totalMs / 3600000); totalMs %= 3600000;
        const mm = Math.floor(totalMs / 60000); totalMs %= 60000;
        const ss = Math.floor(totalMs / 1000);
        const ms = Math.floor(totalMs % 1000);
        return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)},${pad3(ms)}`;
    }

    function pad2(n) { return String(n).padStart(2, '0'); }
    function pad3(n) { return String(n).padStart(3, '0'); }

    function downloadSrt(filename, content) {
        const blob = new Blob([content], { type: 'text/srt;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function nextFrame() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    function clearMemoryAndReset() {
        // Limpar arquivos selecionados
        if (filesInput) {
            filesInput.value = '';
        }
        
        // Limpar preview
        setPreview([]);
        
        // Resetar status após um tempo
        setTimeout(() => {
            setStatus('Pronto para nova junção. Selecione arquivos SRT.');
        }, 3000);
        
        // Limpar qualquer estado interno
        cancelled = false;
    }
})();


