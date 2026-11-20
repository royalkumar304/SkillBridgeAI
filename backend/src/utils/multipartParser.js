/**
 * Multipart/form-data parser for single file uploads without third-party dependencies.
 * Parses incoming binary multipart payloads and extracts file buffers and field names.
 */

const parseMultipartFormData = (req) => {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return reject(new Error('Expected multipart/form-data content type.'));
    }

    const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!match) {
      return reject(new Error('Multipart boundary not found in Content-Type header.'));
    }

    const boundary = match[1] || match[2];
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

    const chunks = [];
    let totalSize = 0;
    const MAX_ALLOWED_BYTES = 5.5 * 1024 * 1024; // 5.5MB streaming ceiling (5MB max file + headers/boundary overhead)

    req.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_ALLOWED_BYTES) {
        req.destroy();
        return reject(new Error('Upload exceeds maximum stream size.'));
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      let fileBuffer = null;
      let filename = 'resume.pdf';
      let fileMime = 'application/octet-stream';

      let startIndex = 0;
      while (startIndex < buffer.length) {
        const bIndex = buffer.indexOf(boundaryBuffer, startIndex);
        if (bIndex === -1) break;

        const headerStart = bIndex + boundaryBuffer.length + 2; // skip \r\n
        const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
        if (headerEnd === -1) break;

        const headerStr = buffer.subarray(headerStart, headerEnd).toString('utf8');
        const nextBIndex = buffer.indexOf(boundaryBuffer, headerEnd + 4);
        if (nextBIndex === -1) break;

        // Content ends 2 bytes before next boundary (\r\n)
        const partContent = buffer.subarray(headerEnd + 4, nextBIndex - 2);

        if (headerStr.includes('filename=')) {
          const fnMatch = headerStr.match(/filename="?([^";\r\n]+)"?/i);
          if (fnMatch) filename = fnMatch[1].trim();

          const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
          if (ctMatch) fileMime = ctMatch[1].trim();

          fileBuffer = partContent;
          break; // Found file
        }

        startIndex = nextBIndex;
      }

      if (!fileBuffer) {
        return reject(new Error('No file field uploaded in form data.'));
      }

      resolve({
        filename,
        mimeType: fileMime,
        buffer: fileBuffer,
      });
    });

    req.on('error', (err) => reject(err));
  });
};

module.exports = {
  parseMultipartFormData,
};
