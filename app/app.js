// Generic Strings
const root_url = "https://electro-smith.github.io/Programmer"

// New changes involve reading from sources.json to find the 'sources' we should pull from
// Those sources replace the previously hard coded 'examples.json' file, and should otherwise 
// function the same.

// The changes should primarily only affect gatherExampleData

// When imported the examples will have the original data located in the .json file
// as well as the 'source' field containing the data structure used to find the example

var data = { 
    platforms: [],
    examples: [],
    no_device: true,
    sel_platform: 'sibilla',
    sel_example: null,
    firmwareFile: null,
    blinkFirmwareFile: null,
    bootloaderFirmwareFile: null,
    displayImportedFile: false,
    displaySelectedFile: false
}

// Global Buffer for reading files
var ex_buffer

// Gets the root url
// should be https://localhost:9001/Programmer on local
// and https://electro-smith.github.io/Programmer on gh-pages
function getRootUrl() {
    var url = document.URL;
    return url;
}

// Reads the specified file containing JSON example meta-data
// function gatherExampleData()
// {
//     // Get Source list as data 
//     var self = this // assign self to 'this' before nested function calls...
//     var src_url = getRootUrl().concat("data/sources.json") 
//     var raw = new XMLHttpRequest();
//     raw.open("GET", src_url, true);
//     raw.responseType = "text"
//     raw.onreadystatechange = function ()
//     {
//         if (this.readyState === 4 && this.status === 200) {
//             var obj = this.response; 
//             buffer = JSON.parse(obj);
//             buffer.forEach( function(ex_src) {
//                 // Launch another request with async function to load examples from the 
//                 // specified urls 
//                 // This will fill examples directly, and replace the importExamples/timeout situation.
//                 var ext_raw = new XMLHttpRequest();
//                 ext_raw.open("GET", ex_src.data_url, true);
//                 ext_raw.responseType = "text"
//                 ext_raw.onreadystatechange = function ()
//                 {
//                     if (this.readyState === 4 && this.status === 200) {
//                         // Now this.response will contain actual example data 
//                         var ext_obj = this.response;
//                         ex_buffer = JSON.parse(ext_obj);
//                         // Now we could just fill the examples data
//                         // ex_buffer.forEach( function(ex_data) {
//                         //     console.log("%s - %s", ex_src.name, ex_data.name);
//                         // })
//                         const unique_platforms = [...new Set(ex_buffer.map(obj => obj.platform))]
//                         // This needs to be fixed to 'ADD' examples
//                         //self.examples = data
//                         self.examples.push(ex_buffer)
//                         var temp_platforms = self.platforms.push(unique_platforms)

//                         const new_platforms = [...new Set(temp_platforms.map(obj => obj))]
//                         self.platforms = new_platforms
//                     }
//                 }
//                 ext_raw.send(null)

//                     // var self = this
//                     // const unique_platforms = [...new Set(data.map(obj => obj.platform))] 
//                     // self.examples = data
//                     // self.platforms = unique_platforms
//             })
//         }
//     }
//     raw.send(null)
// }


function displayReadMe(fname)
{
    var url = self.data.sel_example.url
    fname   = fname.substring(5,fname.length-4);
    
    div = document.getElementById("readme")

    marked.setOptions({
	renderer: new marked.Renderer(),
	highlight: function(code, language) {
	    const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
	    return hljs.highlight(validLanguage, code).value;
	},
	pedantic: false,
	gfm: true,
	breaks: false,
	sanitize: false,
	smartLists: true,
	smartypants: false,
	xhtml: false
    });
    
    
    fetch(url)
	.then(response => response.text())
    	.then(text => div.innerHTML = marked.parse(text.replace("404: Not Found", "No additional details available for this example.")));
}

async function readServerFirmwareFile(path, dispReadme = true)
{
    return new Promise((resolve) => {
        var buffer
        var raw = new XMLHttpRequest();
        var fname = path;
    
        if(dispReadme){
            displayReadMe(fname)
        }
    
        raw.open("GET", fname, true);
        raw.responseType = "arraybuffer"
        raw.onreadystatechange = function ()
        {
            if (this.readyState === 4 && this.status === 200) {
                resolve(this.response)
            }    
        }
        raw.send(null)
    })
}

var app = new Vue({
    el: '#app',
    template: 
    `
    <b-container class="app_body" style="max-width:800px">
    <link rel="stylesheet" href="//use.fontawesome.com/releases/v5.0.7/css/all.css">
    
    <div align="center">
        <button id="detach" disabled="true" hidden="true">Detach DFU</button>
        <button id="upload" disabled="true" hidden="true">Upload</button>
        <b-form id="configForm">
            <p> <label for="transferSize"  hidden="true">Transfer Size:</label>
            <input type="number" name="transferSize"  hidden="true" id="transferSize" value="1024"></input> </p>
            <p> <span id="status"></span> </p>

            <p><label hidden="true" for="vid">Vendor ID (hex):</label>
            <input hidden="true" list="vendor_ids" type="text" name="vid" id="vid" maxlength="6" size="8" pattern="0x[A-Fa-f0-9]{1,4}">
            <datalist id="vendor_ids"> </datalist> </p>

            <div id="dfuseFields" hidden="true">
                <label for="dfuseStartAddress" hidden="true">DfuSe Start Address:</label>
                <input type="text" name="dfuseStartAddress" id="dfuseStartAddress"  hidden="true" title="Initial memory address to read/write from (hex)" size="10" pattern="0x[A-Fa-f0-9]+">
                <label for="dfuseUploadSize" hidden="true">DfuSe Upload Size:</label>
                <input type="number" name="dfuseUploadSize" id="dfuseUploadSize" min="1" max="2097152" hidden="true">
            </div>
        </b-form>
    </div>
    
    <b-row align="center" class="app_column app_column_top app_column_round_top">

      <h2>Sibilla Web Programmer<b-button style="float:right;" variant="es" v-b-toggle.collapseHelp><i class="fa fa-question-circle" aria-hidden="true"></i></b-button></h2>

    </b-row>


    <b-collapse id="collapseHelp" class="app_column app_column_top">
        <div class="nested_list">
            <h2>Setup and programming:</h2>
            <p>Follow the steps below to upload a new firmware to your Sibilla (a micro USB type B cable is required; be sure it's a data transfer cable):</p>
            <ol>
                <li><p>Turn off the power of your eurorack case</p></li>
                <li><p>Remove the power connector on the back of Sibilla</p></li>
                <li><p>Connect Sibilla to your computer via USB</p></li>
                <li><p>Hold the <b><i>BOOT</i></b> button down on the back of the module, and then press and release the <b><i>RESET</i></b> button. Release the <b><i>BOOT</i></b> button</p></li>
                <li><p>Click the <b><i>Connect</i></b> button on the top of this page and then click and select "DFU in FS mode" on the pop-up window</p></li>
                <li><p>Select a firmware version do you prefere from the menu below</p></li>
                <li><p>Click Program and wait for the progress bar to finish</p></li>
            </ol>
            <p>
                On windows, you may have to update the driver to WinUSB.<br/>
                To do this, you can download the free software, Zadig. Instructions for this can be found on the DaisyWiki in the Windows toolchain instructions page.
            </p>
            <p>
              You'll get the message "Programming done!" once the uploading process is finished. Sibilla will now start to operate according to the uploaded firmware.<br/>
              Please note that not all its functions will be active with the USB power line. To fully test your new uploaded code, disconnect the USB from the module and plug Sibilla back into your eurorack case.
            </p>
        </div>
    </b-collapse>
    
    <b-row align="center" class="app_column app_column_top">
      <b-container>
        <legend>1. Connect Sibilla to your computer</legend>
        <p><b-button variant="es" id="connect"> Connect</b-button></p>
        <dialog id="interfaceDialog">
            Your device has multiple DFU interfaces. Select "DFU in FS mode" from the list below:
            <b-form id="interfaceForm" method="dialog">
                <b-button id="selectInterface" type="submit">Select interface</b-button>
            </b-form>
        </dialog>
        <div id="usbInfo" hidden="true" style="white-space: pre"></div>
        <div id="dfuInfo"  hidden="true" style="white-space: pre"></div>
       </b-container>
    </b-row>

    <b-row align="center" class="app_column app_column_top">
      <b-container>
          <b-row class="p-2" style="display:none;">
              <legend>Getting Started!!! Flash the Blink example!</legend>
              <div><b-button variant="es" id="blink"  :disabled="no_device">Flash Blink!</b-button></div>
          </b-row>
          <b-row class="p-2" style="max-width:500px;">
              <legend>2. Select a firmware version to upload</legend>
              <b-form-select placeholder="Platform" v-model="sel_platform" textContent="Select a platform" id="platformSelector" style="display:none;">
                  <option v-for="platform in platforms" :value="platform">{{platform}}</option>
              </b-form-select>
              <b-form-select v-model="sel_example" id="firmwareSelector" required @change="programChanged">
                  <template v-slot:first>
                      <b-form-select-option :value="null" disabled>-- Firmware version --</b-form-select-option>
                  </template>
                  <b-form-select-option v-for="example in platformExamples" v-bind:key="example.name" :value="example">{{example.name}}</b-form-select-option>
              </b-form-select>
          </b-row>
          <b-row class="p-2">
              <div id = "readme"></div>
          </b-row>
          <b-row class="p-2" style="display:none;">
              <legend> Or select a file from your computer</legend>
                  <b-form-file
                      id="firmwareFile"
                      v-model="firmwareFile"
                      :state="Boolean(firmwareFile)"
                      placeholder="Choose or drop a file..."
                      drop-placeholder="Drop file here..."
                  ></b-form-file>
          </b-row>
      </b-container>
    </b-row>
        
        <b-row align="center" class="app_column app_column_round_bottom">
        <b-container>
            <legend>3. Program it!</legend>
            <b-button id="download" variant='es' :disabled="no_device || !sel_example"> Program</b-button>


            <b-button variant="es" v-b-toggle.collapseAdvanced style="display:none;">Advanced...</b-button>
            <b-collapse id="collapseAdvanced">
                <br> <div> <b-button variant="es" id="bootloader"  :disabled="no_device">Flash Bootloader Image</b-button> </div>                        
            </b-collapse>

            <div class="log" id="downloadLog"></div>            
            <br><br>
            <div v-if="sel_example||firmwareFile" >            
                <div v-if="displaySelectedFile">
                <!--<h3 class="info">Name: {{sel_example.name}}</h3>-->
                <!--<li>Description: {{sel_example.description}}</li>-->
                <!--<h3 class="info">File Location: {{sel_example.filepath}} </h3>-->
                </div>
            <br>
            </div>

        </b-container>
        
        </b-row>
    </b-row>        
    
    </b-container>
    `,
    data: data,
    computed: {
        platformExamples: function () {
        	
            return this.examples.filter(example => example.platform === this.sel_platform)
        }
    },
    created() {
        console.log("Page Created")
    },
    mounted() {
        var self = this
        console.log("Mounted Page")
        //var fpath = getRootUrl().concat("bin/examples.json");
        //gatherExampleData()
        // setTimeout(function(){
        //     self.importExamples(buffer)
        // }, 1000)
        this.importExamples()
    },
    methods: {
        importExamples() {
            // var self = this
            // const unique_platforms = [...new Set(data.map(obj => obj.platform))] 
            // self.examples = data
            // self.platforms = unique_platforms
            // New code below:
            // Get Source list as data 
            var self = this // assign self to 'this' before nested function calls...
            var src_url = getRootUrl().split("?")[0].replace("index.html", "").concat("data/sources.json") //need to strip out query string
            var raw = new XMLHttpRequest();
            raw.open("GET", src_url, true);
            raw.responseType = "text"
            raw.onreadystatechange = function ()
            {
                if (this.readyState === 4 && this.status === 200) {
                    var obj = this.response;
                    buffer = JSON.parse(obj);
                    buffer.forEach( function(ex_src) {
                        // Launch another request with async function to load examples from the 
                        // specified urls 
                        // This will fill examples directly, and replace the importExamples/timeout situation.
                        var ext_raw = new XMLHttpRequest();
                        ext_raw.open("GET", ex_src.data_url, true);
                        ext_raw.responseType = "text"
                        ext_raw.onreadystatechange = function ()
                        {
                            // This response will contain example data for the specified source.
                            if (this.readyState === 4 && this.status === 200) {
                                var ext_obj = this.response;
                                ex_buffer = JSON.parse(ext_obj);
                                const unique_platforms = [...new Set(ex_buffer.map(obj => obj.platform))]
                                ex_buffer.forEach( function(ex_dat) {
                                    //  Add "source" to example data
                                    ex_dat.source = ex_src
                                    
                                    self.examples.sort(function (i1, i2){ 
                                        return i1.name.toLowerCase() < i2.name.toLowerCase() ? -1 : 1
                                    })
                                    self.examples.push(ex_dat)
                                })
                                unique_platforms.forEach( function(u_plat) {
                                    if (!self.platforms.includes(u_plat) && u_plat == 'sibilla') {
                                        self.platforms.push(u_plat)
                                    }
                                })
                            }
                        }
                        ext_raw.send(null)

                            // var self = this
                            // const unique_platforms = [...new Set(data.map(obj => obj.platform))] 
                            // self.examples = data
                            // self.platforms = unique_platforms
                    })
                }
            }
            raw.send(null)
        },
        programChanged(){
        	var self = this

            // Read new file
            self.firmwareFileName = self.sel_example.name
            this.displaySelectedFile = true;
            var srcurl = self.sel_example.source.repo_url
            //var expath = srcurl.substring(0, srcurl.lastIndexOf("/") +1).extend;
            var expath = srcurl.concat(self.sel_example.filepath)
        	readServerFirmwareFile(expath).then(buffer => {
                firmwareFile = buffer
            })
        },
    },
    watch: {
        firmwareFile(newfile){
            firmwareFile = null;
            this.displaySelectedFile = true;
            // Create dummy example struct
            // This updates sel_example to enable the Program button when a file is loaded
            var new_example = {
                name: newfile.name,
                description: "Imported File",
                filepath: null,
                platform: null
            }
            this.sel_example = new_example;
            let reader = new FileReader();
            reader.onload = function() {
                this.firmwareFile = reader.result;
                firmwareFile = reader.result;
            }
            reader.readAsArrayBuffer(newfile);
        },
        examples(){
            var self = this

            //grab the blink firmware file
            var blink_example = self.examples.filter(example => example.name.toLowerCase() === "blink" && example.platform === "seed")[0]

            // Read new file
            self.firmwareFileName = blink_example.name
            var srcurl = blink_example.source.repo_url
            var expath = srcurl.concat(blink_example.filepath)
        	readServerFirmwareFile(expath, false).then(buffer => {
                blinkFirmwareFile = buffer
            })

            // grab the bootloader firmware file
            var srcurl = blink_example.source.bootloader_url
        	readServerFirmwareFile(srcurl, false).then(buffer => {
                bootloaderFirmwareFile = buffer
            })

            //parse the query strings
            var searchParams = new URLSearchParams(getRootUrl().split("?")[1])
            
            var platform = searchParams.get('platform')
            var name = searchParams.get('name')
            if(platform != null && self.examples.filter(ex => ex.platform === platform)){
                self.sel_platform = platform

                if(name != null){
                    var ex = self.examples.filter(ex => ex.name === name && ex.platform === platform)[0]
                    if(ex != null){
                        self.sel_example = ex
                        this.programChanged()
                    }    
                }
            }
        }
    }
})
