import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import {useEffect, useState} from 'react';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

// Constants

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Embed public key of program account
const baseAccount = new PublicKey('CBwSeef62zCY3CbUgQnKQPmokozQp5FDcsfMwFUgXHX2');

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// TEST GIFS
const TEST_GIFS = [
	'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
	'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
	'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
	'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]

// buildspace twitter stuff
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  // Is phantom wallet connected?
  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window;

      if(solana) {
        if(solana.isPhantom) {
          console.log('Phantom Wallet is found!');
          const response = await solana.connect({onlyIfTrusted: true});
          console.log('Connected with PubKey:', response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        } else {
          alert('Solana obj is not found - get Phantom Wallet');
        }
      }
    } catch (err) {
      console.log('err');
    }
  };

  // Connect Wallet Logic
  const connectWallet = async () => {
    // Render UI when user wallet is not connected
    const {solana} = window;

    if(solana) {
      const response = await solana.connect();
      console.log('Connected with pubKey:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  // Send Gif from valid link to our grid
  const sendGif = async () => {
    if(inputValue.length === 0) {
      console.log('No gif link given!');
      return;
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount,
          user: provider.wallet.publicKey,
        },
      });
      console.log('Gif successfully sent to our program', inputValue);

      await getGifList();
    } catch (err) {
      console.log('Error sending gif to program', err);
    }
  };

  // Get Input Change
  const onInputChange = (event) => {
    const {value} = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  // Call Initialize
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping')
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log('Created a new BaseAccount w/ address:', baseAccount.toString());
      await getGifList();
  
    } catch(err) {
      console.log('Error creating BaseAccount account:', err);
    }
  }
  
  const renderNotConnectedContainer = () => (
    <button
      className='cta-button connect-wallet-button'
      onClick={connectWallet}
    >
      Connect Wallet!
    </button>
  );

  const renderConnectedContainer = () => {
    // Program Account Not init
    if(gifList === null) {
      return (
        <div className='connected-container'>
          <button className='cta-button submit-gif-button' onClick={createGifAccount}>One Time Init for GIF Program Account</button>
        </div>
      )
    }
    else {
      // Account exists and user can submit gifs
      return(
      <div className='connected-container'>
        <input type='text' placeholder='Enter gif link here!' value={inputValue} onChange={onInputChange}/>
        <button className='cta-button submit-gif-button' onClick={sendGif}>Submit Gif!</button>
        <div className='gif-grid'>
          {gifList.map((item, index) => (
            <div className='gif-item' key={index}>
              <img src={item.gifLink} alt={item.gifLink}/>
              <p className='submit-text'>Submitted by: {item.userAddress.toString()}</p>
            </div>
          ))}
        </div>
      </div>
      )
    }
  };

  // get gif list
  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount);
      
      console.log('Account retrieved', account)
      setGifList(account.gifList)
  
    } catch (err) {
      console.log('getGifs error: ', err)
      setGifList(null);
    }
  }

  // Check for connected wallet
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  // Fetch gif list from connected wallet
  useEffect(() => {
    if(walletAddress) {
      console.log('Fetching Gif List...');
      // Call solana program && set state
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">Gifurry</p>
          <p className="sub-text">
          ✨ add gifs of fur frens to explore the metaverse with ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
