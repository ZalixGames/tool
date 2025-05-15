// Copy Link Functionality
const copyLinkButton = document.getElementById('copyLink');

copyLinkButton.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        // Show success message
        const tooltip = copyLinkButton.getAttribute('data-tooltip');
        copyLinkButton.setAttribute('data-tooltip', 'Link copied!');
        setTimeout(() => {
            copyLinkButton.setAttribute('data-tooltip', tooltip);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy link:', err);
    });
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
});

// Check for saved theme preference
if (localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
}

// Navigation
const dashboard = document.getElementById('dashboard');
const toolSections = document.getElementById('toolSections');
const backToDashboard = document.getElementById('backToDashboard');

document.querySelectorAll('.open-tool').forEach(button => {
    button.addEventListener('click', () => {
        const toolId = button.getAttribute('data-tool');
        showTool(toolId);
    });
});

backToDashboard.addEventListener('click', () => {
    dashboard.classList.remove('hidden');
    toolSections.classList.add('hidden');
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.add('hidden');
    });
});

function showTool(toolId) {
    // Load ads before showing the tool
    loadAllAds();
    
    // Then show the tool
    dashboard.classList.add('hidden');
    toolSections.classList.remove('hidden');
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`${toolId}Tool`).classList.remove('hidden');
}

// Text to PDF Tool
const pdfTool = document.getElementById('pdfTool');
pdfTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Text to PDF Converter</h2>
        <textarea id="pdfText" class="w-full p-4 border rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" 
            placeholder="Enter your text here..."></textarea>
        <div class="flex gap-4">
            <button id="generatePdf" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                Generate PDF
            </button>
            <button id="clearPdf" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                Clear
            </button>
        </div>
    </div>
`;

document.getElementById('generatePdf').addEventListener('click', () => {
    // Load ads before generating PDF
    loadAllAds();
    
    const text = document.getElementById('pdfText').value;
    if (!text) {
        alert('Please enter some text first!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(text, 10, 10);
    doc.save('document.pdf');
});

document.getElementById('clearPdf').addEventListener('click', () => {
    document.getElementById('pdfText').value = '';
});

// Image Compressor Tool
const imageTool = document.getElementById('imageTool');
imageTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Image Compressor</h2>
        <div class="mb-4">
            <input type="file" id="imageInput" accept="image/*" class="hidden">
            <label for="imageInput" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                Choose Image
            </label>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Original Image</h3>
                <img id="originalImage" class="preview-image hidden">
                <p id="originalSize" class="text-gray-600 dark:text-gray-300"></p>
            </div>
            <div>
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Compressed Image</h3>
                <img id="compressedImage" class="preview-image hidden">
                <p id="compressedSize" class="text-gray-600 dark:text-gray-300"></p>
            </div>
        </div>
        <div class="mt-4">
            <label class="text-gray-800 dark:text-white">Quality:</label>
            <input type="range" id="qualitySlider" min="0" max="1" step="0.1" value="0.6" class="w-full">
            <button id="compressImage" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors mt-4">
                Compress Image
            </button>
            <button id="downloadCompressed" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors mt-4 ml-2 hidden">
                Download
            </button>
        </div>
    </div>
`;

let originalFile = null;

document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        originalFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('originalImage');
            img.src = e.target.result;
            img.classList.remove('hidden');
            document.getElementById('originalSize').textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('compressImage').addEventListener('click', async () => {
    // Load ads before compression
    loadAllAds();
    
    if (!originalFile) {
        alert('Please select an image first!');
        return;
    }

    const quality = parseFloat(document.getElementById('qualitySlider').value);
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: quality
    };

    try {
        const compressedFile = await imageCompression(originalFile, options);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('compressedImage');
            img.src = e.target.result;
            img.classList.remove('hidden');
            document.getElementById('compressedSize').textContent = `Size: ${(compressedFile.size / 1024).toFixed(2)} KB`;
            document.getElementById('downloadCompressed').classList.remove('hidden');
        };
        reader.readAsDataURL(compressedFile);
    } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error compressing image. Please try again.');
    }
});

document.getElementById('downloadCompressed').addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = document.getElementById('compressedImage').src;
    link.download = 'compressed-image.jpg';
    link.click();
});

// Word Counter Tool
const wordTool = document.getElementById('wordTool');
wordTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Word Counter</h2>
        <textarea id="wordText" class="w-full p-4 border rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" 
            placeholder="Type or paste your text here..."></textarea>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Words</h3>
                <p id="wordCount" class="text-2xl font-bold text-blue-500">0</p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Characters</h3>
                <p id="charCount" class="text-2xl font-bold text-blue-500">0</p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Paragraphs</h3>
                <p id="paraCount" class="text-2xl font-bold text-blue-500">0</p>
            </div>
        </div>
    </div>
`;

document.getElementById('wordText').addEventListener('input', () => {
    const text = document.getElementById('wordText').value;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const chars = text.length;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).length : 0;

    document.getElementById('wordCount').textContent = words.length;
    document.getElementById('charCount').textContent = chars;
    document.getElementById('paraCount').textContent = paragraphs;
});

// QR Code Generator Tool
const qrTool = document.getElementById('qrTool');
qrTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">QR Code Generator</h2>
        <div class="mb-4">
            <input type="text" id="qrText" class="w-full p-4 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white" 
                placeholder="Enter text or URL...">
        </div>
        <div class="flex gap-4 mb-4">
            <button id="generateQR" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                Generate QR Code
            </button>
            <button id="downloadQR" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors hidden">
                Download QR Code
            </button>
        </div>
        <div id="qrcode" class="mt-4"></div>
    </div>
`;

document.getElementById('generateQR').addEventListener('click', () => {
    // Load ads before generating QR code
    loadAllAds();
    
    const text = document.getElementById('qrText').value;
    if (!text) {
        alert('Please enter some text or URL!');
        return;
    }

    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = '';
    new QRCode(qrcodeDiv, {
        text: text,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('downloadQR').classList.remove('hidden');
});

document.getElementById('downloadQR').addEventListener('click', () => {
    const canvas = document.querySelector('#qrcode canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'qrcode.png';
        link.click();
    }
});

// Unit Converter Tool
const unitTool = document.getElementById('unitTool');
unitTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Unit Converter</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <select id="conversionType" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-4">
                    <option value="length">Length</option>
                    <option value="weight">Weight</option>
                    <option value="temperature">Temperature</option>
                </select>
                <div id="conversionInputs" class="space-y-4">
                    <!-- Dynamic inputs will be inserted here -->
                </div>
            </div>
            <div id="conversionResult" class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Result</h3>
                <p id="resultText" class="text-2xl font-bold text-blue-500">0</p>
            </div>
        </div>
    </div>
`;

const conversionTypes = {
    length: {
        units: ['meter', 'kilometer', 'centimeter', 'millimeter', 'inch', 'foot', 'yard', 'mile'],
        conversions: {
            meter: 1,
            kilometer: 1000,
            centimeter: 0.01,
            millimeter: 0.001,
            inch: 0.0254,
            foot: 0.3048,
            yard: 0.9144,
            mile: 1609.344
        }
    },
    weight: {
        units: ['kilogram', 'gram', 'milligram', 'pound', 'ounce'],
        conversions: {
            kilogram: 1,
            gram: 0.001,
            milligram: 0.000001,
            pound: 0.45359237,
            ounce: 0.028349523125
        }
    },
    temperature: {
        units: ['celsius', 'fahrenheit', 'kelvin'],
        special: true
    }
};

function updateConversionInputs() {
    const type = document.getElementById('conversionType').value;
    const container = document.getElementById('conversionInputs');
    container.innerHTML = '';

    if (conversionTypes[type].special) {
        // Special handling for temperature
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-gray-800 dark:text-white mb-2">From</label>
                    <select id="fromUnit" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                        ${conversionTypes[type].units.map(unit => `<option value="${unit}">${unit}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-gray-800 dark:text-white mb-2">To</label>
                    <select id="toUnit" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                        ${conversionTypes[type].units.map(unit => `<option value="${unit}">${unit}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-gray-800 dark:text-white mb-2">Value</label>
                    <input type="number" id="conversionValue" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white" 
                        placeholder="Enter value...">
                </div>
            </div>
        `;
    } else {
        // Standard conversion for length and weight
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-gray-800 dark:text-white mb-2">From</label>
                    <select id="fromUnit" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                        ${conversionTypes[type].units.map(unit => `<option value="${unit}">${unit}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-gray-800 dark:text-white mb-2">To</label>
                    <select id="toUnit" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                        ${conversionTypes[type].units.map(unit => `<option value="${unit}">${unit}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-gray-800 dark:text-white mb-2">Value</label>
                    <input type="number" id="conversionValue" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white" 
                        placeholder="Enter value...">
                </div>
            </div>
        `;
    }

    // Add event listeners
    document.getElementById('conversionValue').addEventListener('input', convert);
    document.getElementById('fromUnit').addEventListener('change', convert);
    document.getElementById('toUnit').addEventListener('change', convert);
}

function convert() {
    // Load ads on conversion
    loadAllAds();
    
    const type = document.getElementById('conversionType').value;
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    const value = parseFloat(document.getElementById('conversionValue').value);

    if (isNaN(value)) {
        document.getElementById('resultText').textContent = '0';
        return;
    }

    let result;
    if (type === 'temperature') {
        // Convert to Celsius first
        let celsius;
        switch (fromUnit) {
            case 'celsius':
                celsius = value;
                break;
            case 'fahrenheit':
                celsius = (value - 32) * 5/9;
                break;
            case 'kelvin':
                celsius = value - 273.15;
                break;
        }

        // Convert from Celsius to target unit
        switch (toUnit) {
            case 'celsius':
                result = celsius;
                break;
            case 'fahrenheit':
                result = (celsius * 9/5) + 32;
                break;
            case 'kelvin':
                result = celsius + 273.15;
                break;
        }
    } else {
        // Standard conversion for length and weight
        const fromFactor = conversionTypes[type].conversions[fromUnit];
        const toFactor = conversionTypes[type].conversions[toUnit];
        result = (value * fromFactor) / toFactor;
    }

    document.getElementById('resultText').textContent = result.toFixed(4);
}

document.getElementById('conversionType').addEventListener('change', updateConversionInputs);
updateConversionInputs();

// Age Calculator Tool
const ageTool = document.getElementById('ageTool');
ageTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Age Calculator</h2>
        <div class="mb-4">
            <label class="block text-gray-800 dark:text-white mb-2">Date of Birth</label>
            <input type="date" id="birthDate" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
        </div>
        <button id="calculateAge" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            Calculate Age
        </button>
        <div id="ageResult" class="mt-4 space-y-2 hidden">
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Age</h3>
                <p id="ageText" class="text-2xl font-bold text-blue-500"></p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Next Birthday</h3>
                <p id="nextBirthday" class="text-2xl font-bold text-blue-500"></p>
            </div>
        </div>
    </div>
`;

document.getElementById('calculateAge').addEventListener('click', () => {
    // Load ads before calculation
    loadAllAds();
    
    const birthDate = new Date(document.getElementById('birthDate').value);
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
        alert('Please select a valid date!');
        return;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

    document.getElementById('ageText').textContent = `${age} years`;
    document.getElementById('nextBirthday').textContent = `${daysUntilBirthday} days until next birthday`;
    document.getElementById('ageResult').classList.remove('hidden');
});

// Typing Test Tool
const typingTool = document.getElementById('typingTool');
typingTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Typing Test</h2>
        <div class="mb-4">
            <select id="testDuration" class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-4">
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes</option>
            </select>
        </div>
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <div id="typingText" class="typing-area text-gray-800 dark:text-white"></div>
        </div>
        <div class="mb-4">
            <input type="text" id="typingInput" class="w-full p-4 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white" 
                placeholder="Start typing here..." disabled>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">WPM</h3>
                <p id="wpm" class="text-2xl font-bold text-blue-500">0</p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Accuracy</h3>
                <p id="accuracy" class="text-2xl font-bold text-blue-500">0%</p>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Time</h3>
                <p id="time" class="text-2xl font-bold text-blue-500">0s</p>
            </div>
        </div>
        <button id="startTest" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            Start Test
        </button>
        <button id="resetTest" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors ml-2 hidden">
            Reset
        </button>
    </div>
`;

const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
    "Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages.",
    "The Internet is a global network of billions of computers and other electronic devices. With the Internet, it's possible to access almost any information, communicate with anyone else in the world, and do much more.",
    "Artificial intelligence is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction."
];

let testInterval;
let startTime;
let currentText = '';
let currentIndex = 0;
let correctChars = 0;
let totalChars = 0;

function startTest() {
    // Load ads when test starts
    loadAllAds();
    
    const duration = parseInt(document.getElementById('testDuration').value);
    currentText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    document.getElementById('typingText').innerHTML = currentText.split('').map((char, index) => 
        `<span id="char-${index}">${char}</span>`
    ).join('');
    
    document.getElementById('typingInput').value = '';
    document.getElementById('typingInput').disabled = false;
    document.getElementById('typingInput').focus();
    
    document.getElementById('startTest').classList.add('hidden');
    document.getElementById('resetTest').classList.remove('hidden');
    document.getElementById('testDuration').disabled = true;
    
    startTime = new Date();
    currentIndex = 0;
    correctChars = 0;
    totalChars = 0;
    
    testInterval = setInterval(updateStats, 100);
    
    setTimeout(() => {
        clearInterval(testInterval);
        document.getElementById('typingInput').disabled = true;
        document.getElementById('resetTest').classList.remove('hidden');
    }, duration * 1000);
}

function updateStats() {
    const elapsedTime = (new Date() - startTime) / 1000;
    const wpm = Math.round((correctChars / 5) / (elapsedTime / 60));
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    
    document.getElementById('wpm').textContent = wpm;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    document.getElementById('time').textContent = `${Math.round(elapsedTime)}s`;
}

document.getElementById('typingInput').addEventListener('input', (e) => {
    const input = e.target.value;
    const currentChar = currentText[currentIndex];
    
    if (currentIndex < currentText.length) {
        const charElement = document.getElementById(`char-${currentIndex}`);
        if (input[input.length - 1] === currentChar) {
            charElement.classList.add('correct');
            correctChars++;
        } else {
            charElement.classList.add('incorrect');
        }
        totalChars++;
        currentIndex++;
    }
});

document.getElementById('startTest').addEventListener('click', startTest);
document.getElementById('resetTest').addEventListener('click', () => {
    clearInterval(testInterval);
    document.getElementById('typingInput').value = '';
    document.getElementById('typingInput').disabled = false;
    document.getElementById('testDuration').disabled = false;
    document.getElementById('startTest').classList.remove('hidden');
    document.getElementById('resetTest').classList.add('hidden');
    document.getElementById('wpm').textContent = '0';
    document.getElementById('accuracy').textContent = '0%';
    document.getElementById('time').textContent = '0s';
    document.getElementById('typingText').innerHTML = '';
});

// Password Generator Tool
const passwordTool = document.getElementById('passwordTool');
passwordTool.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Password Generator</h2>
        <div class="space-y-4">
            <div>
                <label class="block text-gray-800 dark:text-white mb-2">Password Length</label>
                <input type="range" id="passwordLength" min="8" max="32" value="16" class="w-full">
                <span id="lengthValue" class="text-gray-800 dark:text-white">16</span>
            </div>
            <div class="space-y-2">
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="includeUppercase" checked class="form-checkbox">
                    <span class="text-gray-800 dark:text-white">Include Uppercase Letters</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="includeLowercase" checked class="form-checkbox">
                    <span class="text-gray-800 dark:text-white">Include Lowercase Letters</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="includeNumbers" checked class="form-checkbox">
                    <span class="text-gray-800 dark:text-white">Include Numbers</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="includeSymbols" checked class="form-checkbox">
                    <span class="text-gray-800 dark:text-white">Include Symbols</span>
                </label>
            </div>
            <button id="generatePassword" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                Generate Password
            </button>
            <div class="relative">
                <input type="text" id="generatedPassword" readonly class="w-full p-4 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                <button id="copyPassword" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Copy
                </button>
            </div>
            <div id="passwordStrength" class="mt-4">
                <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Password Strength</h3>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div id="strengthBar" class="h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <p id="strengthText" class="mt-2 text-gray-800 dark:text-white"></p>
            </div>
        </div>
    </div>
`;

document.getElementById('passwordLength').addEventListener('input', (e) => {
    document.getElementById('lengthValue').textContent = e.target.value;
});

function generatePassword() {
    // Load ads before generating password
    loadAllAds();
    
    const length = parseInt(document.getElementById('passwordLength').value);
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;

    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        alert('Please select at least one character type!');
        return;
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    document.getElementById('generatedPassword').value = password;
    checkPasswordStrength(password);
}

function checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];

    if (password.length >= 12) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^A-Za-z0-9]/)) strength += 25;

    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    strengthBar.style.width = `${Math.min(strength, 100)}%`;

    if (strength <= 25) {
        strengthBar.style.backgroundColor = '#ef4444';
        strengthText.textContent = 'Weak';
    } else if (strength <= 50) {
        strengthBar.style.backgroundColor = '#f59e0b';
        strengthText.textContent = 'Fair';
    } else if (strength <= 75) {
        strengthBar.style.backgroundColor = '#10b981';
        strengthText.textContent = 'Good';
    } else {
        strengthBar.style.backgroundColor = '#3b82f6';
        strengthText.textContent = 'Strong';
    }
}

document.getElementById('generatePassword').addEventListener('click', generatePassword);
document.getElementById('copyPassword').addEventListener('click', () => {
    const password = document.getElementById('generatedPassword');
    password.select();
    document.execCommand('copy');
    alert('Password copied to clipboard!');
});

// Ad Management Functions
function loadDirectLinkAd() {
    window.location.href = 'https://www.profitableratecpm.com/zi30dfhjnn?key=b78830ea0cb80a28c4b278ee2e122b06';
}

function loadBannerAd() {
    const adContainer = document.getElementById('banner-ad-container');
    if (adContainer) {
        adContainer.innerHTML = `
            <script type="text/javascript">
                atOptions = {
                    'key' : '34daa95d37aa866e4d5dc188a89f19b2',
                    'format' : 'iframe',
                    'height' : 50,
                    'width' : 320,
                    'params' : {}
                };
            </script>
            <script type="text/javascript" src="//www.highperformanceformat.com/34daa95d37aa866e4d5dc188a89f19b2/invoke.js"></script>
        `;
    }
}

function loadSocialBarAd() {
    const script = document.createElement('script');
    script.src = '//pl26479822.profitableratecpm.com/11/f3/83/11f3830187c378aedebef88b0bcd83a0.js';
    document.body.appendChild(script);
}

// Navigation with Ad Integration
document.querySelectorAll('.open-tool').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const toolId = button.getAttribute('data-tool');
        
        // First show direct link ad
        loadDirectLinkAd();
        
        // After ad interaction, the page will reload
        // When page loads, show the tool and other ads
        if (sessionStorage.getItem('showTool') === toolId) {
            sessionStorage.removeItem('showTool');
            showTool(toolId);
            loadBannerAd();
            loadSocialBarAd();
        }
    });
});

// Check if we need to show a tool after ad interaction
window.addEventListener('load', () => {
    const toolToShow = sessionStorage.getItem('showTool');
    if (toolToShow) {
        showTool(toolToShow);
        loadBannerAd();
        loadSocialBarAd();
    }
});

// Load all ads
function loadAllAds() {
    loadBannerAd();
    loadDirectLinkAd();
    loadSocialBarAd();
}

// Navigation with Ad Integration
function showTool(toolId) {
    // Load ads before showing the tool
    loadAllAds();
    
    // Then show the tool
    dashboard.classList.add('hidden');
    toolSections.classList.remove('hidden');
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`${toolId}Tool`).classList.remove('hidden');
}

// Add ad loading to all tool interactions
document.querySelectorAll('.open-tool').forEach(button => {
    button.addEventListener('click', () => {
        const toolId = button.getAttribute('data-tool');
        // Load ads before showing tool
        loadAllAds();
        showTool(toolId);
    });
});

// Text to PDF Tool with Ad Integration
document.getElementById('generatePdf').addEventListener('click', () => {
    // Load ads before generating PDF
    loadAllAds();
    
    const text = document.getElementById('pdfText').value;
    if (!text) {
        alert('Please enter some text first!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(text, 10, 10);
    doc.save('document.pdf');
});

// Image Compressor Tool with Ad Integration
document.getElementById('compressImage').addEventListener('click', async () => {
    // Load ads before compression
    loadAllAds();
    
    if (!originalFile) {
        alert('Please select an image first!');
        return;
    }

    const quality = parseFloat(document.getElementById('qualitySlider').value);
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: quality
    };

    try {
        const compressedFile = await imageCompression(originalFile, options);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('compressedImage');
            img.src = e.target.result;
            img.classList.remove('hidden');
            document.getElementById('compressedSize').textContent = `Size: ${(compressedFile.size / 1024).toFixed(2)} KB`;
            document.getElementById('downloadCompressed').classList.remove('hidden');
        };
        reader.readAsDataURL(compressedFile);
    } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error compressing image. Please try again.');
    }
});

// QR Code Generator with Ad Integration
document.getElementById('generateQR').addEventListener('click', () => {
    // Load ads before generating QR code
    loadAllAds();
    
    const text = document.getElementById('qrText').value;
    if (!text) {
        alert('Please enter some text or URL!');
        return;
    }

    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = '';
    new QRCode(qrcodeDiv, {
        text: text,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('downloadQR').classList.remove('hidden');
});

// Unit Converter with Ad Integration
function convert() {
    // Load ads on conversion
    loadAllAds();
    
    const type = document.getElementById('conversionType').value;
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    const value = parseFloat(document.getElementById('conversionValue').value);

    if (isNaN(value)) {
        document.getElementById('resultText').textContent = '0';
        return;
    }

    let result;
    if (type === 'temperature') {
        // Convert to Celsius first
        let celsius;
        switch (fromUnit) {
            case 'celsius':
                celsius = value;
                break;
            case 'fahrenheit':
                celsius = (value - 32) * 5/9;
                break;
            case 'kelvin':
                celsius = value - 273.15;
                break;
        }

        // Convert from Celsius to target unit
        switch (toUnit) {
            case 'celsius':
                result = celsius;
                break;
            case 'fahrenheit':
                result = (celsius * 9/5) + 32;
                break;
            case 'kelvin':
                result = celsius + 273.15;
                break;
        }
    } else {
        // Standard conversion for length and weight
        const fromFactor = conversionTypes[type].conversions[fromUnit];
        const toFactor = conversionTypes[type].conversions[toUnit];
        result = (value * fromFactor) / toFactor;
    }

    document.getElementById('resultText').textContent = result.toFixed(4);
}

// Age Calculator with Ad Integration
document.getElementById('calculateAge').addEventListener('click', () => {
    // Load ads before calculation
    loadAllAds();
    
    const birthDate = new Date(document.getElementById('birthDate').value);
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
        alert('Please select a valid date!');
        return;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

    document.getElementById('ageText').textContent = `${age} years`;
    document.getElementById('nextBirthday').textContent = `${daysUntilBirthday} days until next birthday`;
    document.getElementById('ageResult').classList.remove('hidden');
});

// Typing Test with Ad Integration
function startTest() {
    // Load ads when test starts
    loadAllAds();
    
    const duration = parseInt(document.getElementById('testDuration').value);
    currentText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    document.getElementById('typingText').innerHTML = currentText.split('').map((char, index) => 
        `<span id="char-${index}">${char}</span>`
    ).join('');
    
    document.getElementById('typingInput').value = '';
    document.getElementById('typingInput').disabled = false;
    document.getElementById('typingInput').focus();
    
    document.getElementById('startTest').classList.add('hidden');
    document.getElementById('resetTest').classList.remove('hidden');
    document.getElementById('testDuration').disabled = true;
    
    startTime = new Date();
    currentIndex = 0;
    correctChars = 0;
    totalChars = 0;
    
    testInterval = setInterval(updateStats, 100);
    
    setTimeout(() => {
        clearInterval(testInterval);
        document.getElementById('typingInput').disabled = true;
        document.getElementById('resetTest').classList.remove('hidden');
    }, duration * 1000);
}

function updateStats() {
    const elapsedTime = (new Date() - startTime) / 1000;
    const wpm = Math.round((correctChars / 5) / (elapsedTime / 60));
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    
    document.getElementById('wpm').textContent = wpm;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    document.getElementById('time').textContent = `${Math.round(elapsedTime)}s`;
}

document.getElementById('typingInput').addEventListener('input', (e) => {
    const input = e.target.value;
    const currentChar = currentText[currentIndex];
    
    if (currentIndex < currentText.length) {
        const charElement = document.getElementById(`char-${currentIndex}`);
        if (input[input.length - 1] === currentChar) {
            charElement.classList.add('correct');
            correctChars++;
        } else {
            charElement.classList.add('incorrect');
        }
        totalChars++;
        currentIndex++;
    }
});

document.getElementById('startTest').addEventListener('click', startTest);
document.getElementById('resetTest').addEventListener('click', () => {
    clearInterval(testInterval);
    document.getElementById('typingInput').value = '';
    document.getElementById('typingInput').disabled = false;
    document.getElementById('testDuration').disabled = false;
    document.getElementById('startTest').classList.remove('hidden');
    document.getElementById('resetTest').classList.add('hidden');
    document.getElementById('wpm').textContent = '0';
    document.getElementById('accuracy').textContent = '0%';
    document.getElementById('time').textContent = '0s';
    document.getElementById('typingText').innerHTML = '';
});

// Password Generator with Ad Integration
function generatePassword() {
    // Load ads before generating password
    loadAllAds();
    
    const length = parseInt(document.getElementById('passwordLength').value);
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;

    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        alert('Please select at least one character type!');
        return;
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    document.getElementById('generatedPassword').value = password;
    checkPasswordStrength(password);
}

function checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];

    if (password.length >= 12) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^A-Za-z0-9]/)) strength += 25;

    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    strengthBar.style.width = `${Math.min(strength, 100)}%`;

    if (strength <= 25) {
        strengthBar.style.backgroundColor = '#ef4444';
        strengthText.textContent = 'Weak';
    } else if (strength <= 50) {
        strengthBar.style.backgroundColor = '#f59e0b';
        strengthText.textContent = 'Fair';
    } else if (strength <= 75) {
        strengthBar.style.backgroundColor = '#10b981';
        strengthText.textContent = 'Good';
    } else {
        strengthBar.style.backgroundColor = '#3b82f6';
        strengthText.textContent = 'Strong';
    }
}

document.getElementById('generatePassword').addEventListener('click', generatePassword);
document.getElementById('copyPassword').addEventListener('click', () => {
    const password = document.getElementById('generatedPassword');
    password.select();
    document.execCommand('copy');
    alert('Password copied to clipboard!');
}); 