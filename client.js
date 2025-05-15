// Updated client.js for audio-only mode, auto redial with call limit and delay
import * as SIP from 'sip.js';

const creds = window.SIP_CREDS || {
  sipUri: 'sip:6000@rverma',
  username: '6000',
  password: 's4X8RV0Q8oxvPnaG',
  targetSipUri: 'sip:8080@rverma',
  role: 'caller'
};

const sipUri = creds.sipUri;
const wsServer = 'wss://qa-u22-tor4.netsapiens.com:9002';
const username = creds.username;
const password = creds.password;
const targetSipUri = creds.targetSipUri;
const role = creds.role || 'caller';

const callStatusElement = document.getElementById('callStatus');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const localVideoElement = document.getElementById('localVideoElement');
const remoteVideoElement = document.getElementById('remoteVideoElement');

let userAgent;
let registerer;
let inviter;
let autoHangupTimer;
let callCount = 0;
const MAX_CALLS = 100;
const CALL_DELAY_MS = 5000; // delay between calls

function updateCallStatus(status) {
  callStatusElement.textContent = `Status: ${status}`;
}

async function startAndRegister() {
  try {
    userAgent = new SIP.UserAgent({
      uri: SIP.UserAgent.makeURI(sipUri),
      transportOptions: {
        server: wsServer
      },
      authorizationUsername: username,
      authorizationPassword: password
    });

    userAgent.delegate = {
      onInvite(invitation) {
        updateCallStatus('Incoming call...');

        invitation.accept({
          sessionDescriptionHandlerOptions: {
            constraints: { audio: true, video: false },
          }
        }).then(() => {
          updateCallStatus('Call Accepted');
          hangupButton.disabled = false;
          callButton.disabled = true;
        }).catch(error => {
          updateCallStatus(`Error accepting call: ${error.message}`);
        });
      }
    };

    await userAgent.start();
    registerer = new SIP.Registerer(userAgent);
    await registerer.register();

    updateCallStatus('Registered');
    callButton.disabled = false;
    hangupButton.disabled = true;

    if (role === 'caller') {
      await makeCall();
    }
  } catch (error) {
    updateCallStatus(`Failed to start: ${error.message}`);
    console.error('Error starting UserAgent:', error);
    callButton.disabled = true;
    hangupButton.disabled = true;
  }
}

async function makeCall() {
  if (!userAgent || callCount >= MAX_CALLS) return;

  updateCallStatus(`Calling... (${callCount + 1}/${MAX_CALLS})`);
  callButton.disabled = true;
  hangupButton.disabled = false;

  try {
    const targetURI = SIP.UserAgent.makeURI(targetSipUri);
    inviter = new SIP.Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      }
    });

    inviter.stateChange.addListener((state) => {
      switch (state) {
        case SIP.SessionState.Establishing:
          updateCallStatus('Ringing...');
          break;
        case SIP.SessionState.Established:
          updateCallStatus(`Call Established (${callCount + 1}/${MAX_CALLS})`);
          autoHangupTimer = setTimeout(async () => {
            hangupCall();
            callCount++;
            if (callCount < MAX_CALLS) {
              updateCallStatus(`Waiting ${CALL_DELAY_MS / 1000}s before next call...`);
              await new Promise(r => setTimeout(r, CALL_DELAY_MS));
              await makeCall();
            } else {
              updateCallStatus('Max call limit reached.');
            }
          }, 10000);
          break;
        case SIP.SessionState.Terminated:
          updateCallStatus('Call Ended');
          callButton.disabled = false;
          hangupButton.disabled = true;
          break;
      }
    });

    await inviter.invite();

  } catch (error) {
    updateCallStatus(`Call Error: ${error.message}`);
    console.error('Call Error:', error);
    callButton.disabled = false;
    hangupButton.disabled = true;
    inviter = null;
  }
}

function hangupCall() {
  if (inviter) {
    updateCallStatus('Hanging up...');
    inviter.bye();
    inviter = null;
    updateCallStatus('Call ended');
    callButton.disabled = false;
    hangupButton.disabled = true;
    if (autoHangupTimer) clearTimeout(autoHangupTimer);
  } else if (registerer) {
    registerer.unregister();
  }
}

callButton.addEventListener('click', makeCall);
hangupButton.addEventListener('click', hangupCall);
window.addEventListener('load', startAndRegister);
