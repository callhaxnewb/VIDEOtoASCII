let videoStream = null;
let isRunning = false;

const referenceasciiChars = "Ñ@#W$9876543210?!abc;:+=-,._______________";
// const referenceasciiChars = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'.__________________";
const asciiChars = referenceasciiChars.replaceAll('_','\u00A0');

const canvas = document.getElementById('ascii-canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-btn');
const stopButton = document.getElementById('stop-btn');
const login = document.getElementById('login');
let textColor = 'white';  // Default text color
let bgColor = 'black';    // Default background color


//event listeners
startButton.addEventListener('click',startVideo);
stopButton.addEventListener('click',stopVideo);

function setupCanvas(){
    //getting device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    //scaling all drawing operations by the dpr
    ctx.scale(dpr,dpr);

    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    canvas.style.backgroundColor = bgColor;
    ctx.font = '10px monospace';
    ctx.fillStyle = textColor;
}

function getASCIIChar(r,g,b){
    //luminance formula
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const charIndex = Math.floor((asciiChars.length-1) * gray/255);
    return asciiChars[charIndex];
}

//processing image to a smaller sizeee
function processImage(videoElement){
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')
    
    const cols = 120;
    const rows = 60;

    tempCanvas.width = cols;
    tempCanvas.height = rows;

    tempCtx.drawImage(videoElement,0,0,cols,rows);

    const imageData = tempCtx.getImageData(0,0,cols,rows);
    return{
        data:imageData.data,
        width:cols,
        height:rows
    };
}

//convert processed image data to ascii on actual canvas
function convertToASCII(imageData){
    const {data,width,height} = imageData;
    const ascii = [];

    for (let i = 0; i< data.length; i+=4){
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        ascii.push(getASCIIChar(r,g,b));
    }

    return {
        characters:ascii,
        width:width,
        height:height
    };
}

function drawASCII(asciiData){
    const {characters,width,height} = asciiData;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = textColor;

    //calculating char size to fit the canvas
    const charWidth = canvas.width / width / window.devicePixelRatio;
    const charHeight = canvas.height / height / window.devicePixelRatio;

    for (let i = 0 ; i<height; i++){
        for( let j = 0; j<width; j++){
            const char = characters[i*width + j];
            ctx.fillText(char,j*charWidth,i*charHeight);
        }
    
    }
}

function startVideo(){
    if(isRunning) return;

    setupCanvas();

    //request access to webcam
    navigator.mediaDevices.getUserMedia({video:true})
        .then(function(stream){
            //store
            videoStream =stream;

            //capturing frames
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.play();
            
            login.innerText="logged in: retr0"
            startButton.disabled = true;
            stopButton.disabled = false;
            isRunning = true;

            //starting animation loop
            videoElement.addEventListener('play',function(){
                function processFrame(){
                    if(!isRunning) return;

                    const imageData = processImage(videoElement);
                    const asciiData = convertToASCII(imageData);
                    drawASCII(asciiData);

                    requestAnimationFrame(processFrame);
                }

                processFrame();
            });
        }).catch(function(err){
            console.log('error accessing webcam :p',err);
            alert('Dont be a hero.');
        });
}

function stopVideo(){
    if(!isRunning) return;

    //stop all video tracks

    if(videoStream){
        videoStream.getTracks().forEach(track=>track.stop());
        videoStream = null;


    }

    ctx.clearRect(0,0,canvas.width,canvas.height);

    login.innerText="logged out"
    startButton.disabled = false;
    stopButton.disabled = true;
    isRunning = false;


}


function setupColorControls() {
    // Create color picker container
    const colorControls = document.createElement('div');
    colorControls.className = 'color-controls';
    document.querySelector('.controls').appendChild(colorControls);
    
    // Text color picker
    const textColorLabel = document.createElement('label');
    textColorLabel.textContent = ' Text Color:';
    textColorLabel.htmlFor = 'text-color';
    
    const textColorPicker = document.createElement('input');
    textColorPicker.type = 'color';
    textColorPicker.id = 'text-color';
    textColorPicker.value = '#ffffff'; // Default green
    textColorPicker.addEventListener('input', function() {
        textColor = this.value;
        if (isRunning) {
            // Update text color in real-time if running
            ctx.fillStyle = textColor;
        }
    });
    
    // Background color picker
    const bgColorLabel = document.createElement('label');
    bgColorLabel.textContent = '   Background Color:';
    bgColorLabel.htmlFor = 'bg-color';
    
    const bgColorPicker = document.createElement('input');
    bgColorPicker.type = 'color';
    bgColorPicker.id = 'bg-color';
    bgColorPicker.value = '#000000'; // Default black
    bgColorPicker.addEventListener('input', function() {
        bgColor = this.value;
        canvas.style.backgroundColor = bgColor;
    });
    
    // Preset options
    const presetLabel = document.createElement('label');
    presetLabel.textContent = '   Presets:';
    
    const presetSelect = document.createElement('select');
    presetSelect.id = 'color-preset';
    
    const presets = [
        { name: 'Terminal', text: '#ffffff', bg: '#000000' },
        { name: 'The Matrix', text: '#00ff00', bg: '#000000' },
        { name: 'Blueprint', text: '#4f8fba', bg: '#0a192f' },
        { name: 'Amber', text: '#ffb000', bg: '#000000' },
        { name: 'Cyberpunk', text: '#ff00ff', bg: '#000000' },
        { name: 'Paper', text: '#000000', bg: '#ffffff' }
    ];
    
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.textContent = preset.name;
        option.value = JSON.stringify(preset);
        presetSelect.appendChild(option);
    });
    
    presetSelect.addEventListener('change', function() {
        const preset = JSON.parse(this.value);
        textColor = preset.text;
        bgColor = preset.bg;
        
        textColorPicker.value = preset.text;
        bgColorPicker.value = preset.bg;
        
        canvas.style.backgroundColor = bgColor;
        if (isRunning) {
            ctx.fillStyle = textColor;
        }
    });
    
    // Append all elements
    colorControls.appendChild(textColorLabel);
    colorControls.appendChild(textColorPicker);
    colorControls.appendChild(bgColorLabel);
    colorControls.appendChild(bgColorPicker);
    colorControls.appendChild(presetLabel);
    colorControls.appendChild(presetSelect);
}

//handling window resize
window.addEventListener('resize',function(){
    if(isRunning){
        setupCanvas();
    }
})

document.addEventListener('DOMContentLoaded', function() {
    setupColorControls();
});