// DOM Elements
const authSection = document.getElementById('auth-section');
const miningSection = document.getElementById('mining-section');
const rewardsSection = document.getElementById('rewards-section');
const airdropsSection = document.getElementById('airdrops-section');
const gamingSection = document.getElementById('gaming-section');
const profileSection = document.getElementById('profile-section');
const walletSection = document.getElementById('wallet-section');

const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const showSignUpBtn = document.getElementById('showSignUp');
const signUpModal = document.getElementById('signUpModal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const googleSignInBtn = document.getElementById('googleSignIn');

const miningButton = document.getElementById('miningButton');
const collectDailyRewardBtn = document.getElementById('collectDailyReward');
const claimAirdropBtn = document.getElementById('claimAirdrop');
const showAccountDetailsBtn = document.getElementById('showAccountDetails');
const showWhitePaperBtn = document.getElementById('showWhitePaper');
const showCustomerServiceBtn = document.getElementById('showCustomerService');
const logoutButton = document.getElementById('logoutButton');
const accountDetailsForm = document.getElementById('accountDetailsForm');
const accountDetailsModal = document.getElementById('accountDetailsModal');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');

const navItems = document.querySelectorAll('.nav-item');
const walletButtons = document.querySelectorAll('.wallet-button');

// Development Mode
const DEV_MODE = false;

// State Management
const userData = {
    username: '',
    email: '',
    fullName: '',
    age: '',
    country: '',
    balance: 0,
    miningRate: 0.75,
    totalMined: 0,
    lastMiningTime: null,
    miningTimer: null,
    transactions: []
};

const sevenDaysReward = {
    currentDay: 0,
    totalReward: 25,
    dailyAmount: 3.57,
    lastCollectionDate: null,
    completedDays: []
};

const airdropState = {
    lastClaimDate: null,
    dailyAmount: 5
};

// Navigation Functions
function showSection(sectionId) {
    const sections = [authSection, miningSection, rewardsSection, airdropsSection, gamingSection, profileSection, walletSection];
    sections.forEach(section => {
        section.classList.remove('active-section');
        section.classList.add('hidden-section');
    });

    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden-section');
        targetSection.classList.add('active-section');
    }

    // Update active nav item
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });

    // Update wallet button state
    walletButtons.forEach(button => {
        button.classList.remove('active');
        if (sectionId === 'wallet') {
            button.classList.add('active');
        }
    });
}

// Firebase Authentication Functions
async function handleSignIn(e) {
    e.preventDefault();
    
    if (DEV_MODE) {
        showSection('mining');
        return;
    }

    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user data from database
        const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userInfo = snapshot.val();
        
        if (userInfo) {
            // Update state
            Object.assign(userData, userInfo);
            userData.uid = user.uid;
            
            showSection('mining');
            updateMiningUI();
            updateWalletUI();
            updateSevenDaysRewardUI();
        } else {
            throw new Error('User data not found');
        }
    } catch (error) {
        showError(error.message);
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    
    if (DEV_MODE) {
        showSection('mining');
        return;
    }

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const raffleCode = document.getElementById('raffleCode').value || null;

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    try {
        // Create user account
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Save additional user data
        const userData = {
            username,
            email,
            balance: 0,
            miningRate: 0.75,
            totalMined: 0,
            createdAt: new Date().toISOString(),
            transactions: []
        };

        if (raffleCode) {
            userData.raffleCode = raffleCode;
        }

        // Save user data to database
        await firebase.database().ref(`users/${user.uid}`).set(userData);

        // Update state
        Object.assign(userData, userData);
        userData.uid = user.uid;

        signUpModal.style.display = 'none';
        showSection('mining');
        updateMiningUI();
        updateWalletUI();
        updateSevenDaysRewardUI();
    } catch (error) {
        showError(error.message);
    }
}

async function handleGoogleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;

        // Check if user exists in database
        const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userInfo = snapshot.val();

        if (!userInfo) {
            // Create new user data
            const userData = {
                username: user.displayName,
                email: user.email,
                balance: 0,
                miningRate: 0.75,
                totalMined: 0,
                createdAt: new Date().toISOString(),
                transactions: []
            };

            // Save user data to database
            await firebase.database().ref(`users/${user.uid}`).set(userData);
        }

        // Update state
        Object.assign(userData, userInfo || userData);
        userData.uid = user.uid;

        showSection('mining');
        updateMiningUI();
        updateWalletUI();
        updateSevenDaysRewardUI();
    } catch (error) {
        showError(error.message);
    }
}

// Mining Functions
async function startMining() {
    if (userData.miningTimer) {
        stopMining();
        return;
    }

    const startTime = Date.now();
    const cycleEndTime = startTime + (24 * 60 * 60 * 1000); // 24 hours from now
    
    // Save mining state to Firebase
    if (userData.uid) {
        try {
            await firebase.database().ref(`users/${userData.uid}/mining`).set({
                startTime: startTime,
                isMining: true,
                lastUpdateTime: startTime,
                cycleEndTime: cycleEndTime
            });

            // Update UI
            miningButton.innerHTML = `
                <i class="fas fa-stop"></i>
                <span>Stop Mining</span>
            `;
            miningButton.classList.add('mining');
            userData.lastMiningTime = startTime;
            
            // Start mining timer
            startMiningTimer(startTime, cycleEndTime);
            
            showNotification('Mining started successfully!', 'success');
        } catch (error) {
            console.error('Error starting mining:', error);
            showNotification('Failed to start mining. Please try again.', 'error');
        }
    }
}

function startMiningTimer(startTime, cycleEndTime) {
    // Clear any existing timer
    if (userData.miningTimer) {
        clearInterval(userData.miningTimer);
    }

    // Update mining timer display
    updateMiningTimer(startTime, cycleEndTime);
    
    // Start mining timer
    userData.miningTimer = setInterval(() => {
        const currentTime = Date.now();
        
        // Check if mining cycle has ended
        if (currentTime >= cycleEndTime) {
            stopMining();
            return;
        }

        // Calculate mined amount based on elapsed time
        const elapsedTime = currentTime - startTime;
        const minedAmount = (elapsedTime / (1000 * 60 * 60)) * userData.miningRate;
        userData.balance = parseFloat(minedAmount.toFixed(2));
        userData.totalMined = parseFloat((userData.totalMined + minedAmount).toFixed(2));

        // Save to Firebase every 5 seconds
        if (currentTime - userData.lastUpdateTime >= 5000) {
            if (userData.uid) {
                const updates = {
                    [`users/${userData.uid}/wallet/balance`]: userData.balance,
                    [`users/${userData.uid}/wallet/totalMined`]: userData.totalMined,
                    [`users/${userData.uid}/mining/lastUpdateTime`]: currentTime
                };
                firebase.database().ref().update(updates);
                userData.lastUpdateTime = currentTime;
            }
        }

        // Update UI
        updateMiningUI();
        updateWalletUI();
        updateMiningTimer(startTime, cycleEndTime);
    }, 1000);
}

async function stopMining() {
    if (userData.miningTimer) {
        clearInterval(userData.miningTimer);
        userData.miningTimer = null;
    }

    // Update Firebase
    if (userData.uid) {
        try {
            await firebase.database().ref(`users/${userData.uid}/mining`).update({
                isMining: false,
                lastUpdateTime: Date.now()
            });

            // Update UI
            miningButton.innerHTML = `
                <i class="fas fa-play"></i>
                <span>Start Mining</span>
            `;
            miningButton.classList.remove('mining');
            
            // Reset timer display
            const timerElement = document.querySelector('.mining-timer');
            if (timerElement) {
                timerElement.textContent = '24:00:00';
            }

            showNotification('Mining stopped successfully!', 'info');
        } catch (error) {
            console.error('Error stopping mining:', error);
            showNotification('Failed to stop mining. Please try again.', 'error');
        }
    }
}

function updateMiningTimer(startTime, cycleEndTime) {
    const timerElement = document.querySelector('.mining-timer');
    if (!timerElement) return;

    const currentTime = Date.now();
    const remainingTime = cycleEndTime - currentTime;

    if (remainingTime <= 0) {
        stopMining();
        timerElement.textContent = '24:00:00';
        return;
    }

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateMiningUI() {
    document.getElementById('balance').textContent = `${userData.balance.toFixed(2)} BTX`;
    document.getElementById('miningRate').textContent = `${userData.miningRate} BTX/hour`;
    document.getElementById('totalMined').textContent = `${userData.totalMined.toFixed(2)} BTX`;

    const walletBalances = document.querySelectorAll('.wallet-balance');
    walletBalances.forEach(balance => {
        balance.textContent = `${userData.balance.toFixed(2)} BTX`;
    });
}

function updateWalletUI() {
    const balanceAmount = document.querySelector('.balance-amount');
    if (balanceAmount) {
        balanceAmount.textContent = `${userData.balance.toFixed(2)} BTX`;
    }

    // Update transaction history
    const transactionList = document.querySelector('.transaction-list');
    if (transactionList) {
        transactionList.innerHTML = userData.transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <span class="transaction-type">${transaction.type}</span>
                    <span class="transaction-date">${transaction.date}</span>
                </div>
                <span class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                    ${transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)} BTX
                </span>
            </div>
        `).join('');
    }
}

// Rewards Functions
function collectDailyReward() {
    const today = new Date().toDateString();
    
    if (sevenDaysReward.lastCollectionDate === today) {
        showNotification('You have already collected your reward today. Come back tomorrow!', 'warning');
        return;
    }

    if (sevenDaysReward.currentDay >= 7) {
        showNotification('You have completed all 7 days of rewards!', 'info');
        return;
    }

    sevenDaysReward.currentDay++;
    sevenDaysReward.lastCollectionDate = today;
    sevenDaysReward.completedDays.push(sevenDaysReward.currentDay);
    userData.balance += sevenDaysReward.dailyAmount;

    // Save to Firebase
    if (userData.uid) {
        const updates = {
            [`users/${userData.uid}/wallet/balance`]: userData.balance,
            [`users/${userData.uid}/rewards/currentDay`]: sevenDaysReward.currentDay,
            [`users/${userData.uid}/rewards/lastCollectionDate`]: today,
            [`users/${userData.uid}/rewards/completedDays/${sevenDaysReward.currentDay}`]: sevenDaysReward.currentDay,
            [`users/${userData.uid}/rewards/totalRewards`]: (userData.rewards?.totalRewards || 0) + sevenDaysReward.dailyAmount
        };

        firebase.database().ref().update(updates)
            .then(() => {
                // Add transaction
                const transaction = {
                    type: 'Daily Reward',
                    amount: sevenDaysReward.dailyAmount,
                    date: new Date().toLocaleDateString(),
                    status: 'completed',
                    description: `Day ${sevenDaysReward.currentDay} Reward`
                };

                firebase.database().ref(`users/${userData.uid}/transactions`).push(transaction);

                // Update UI
                updateSevenDaysRewardUI();
                updateMiningUI();
                updateWalletUI();
                showRewardAnimation(sevenDaysReward.dailyAmount);
                showNotification(`Successfully collected ${sevenDaysReward.dailyAmount} BTX!`, 'success');

                // Update leaderboard
                updateLeaderboards();
            })
            .catch((error) => {
                console.error('Error updating reward data:', error);
                showNotification('Failed to collect reward. Please try again.', 'error');
            });
    }
}

function updateSevenDaysRewardUI() {
    const rewardDays = document.querySelectorAll('.reward-day');
    rewardDays.forEach(day => {
        const dayNumber = parseInt(day.dataset.day);
        day.classList.remove('active', 'completed');
        
        if (sevenDaysReward.completedDays.includes(dayNumber)) {
            day.classList.add('completed');
        } else if (dayNumber === sevenDaysReward.currentDay + 1) {
            day.classList.add('active');
        }
    });

    if (sevenDaysReward.currentDay >= 7) {
        collectDailyRewardBtn.disabled = true;
        collectDailyRewardBtn.textContent = 'All Rewards Collected';
    }
}

function showRewardAnimation(amount) {
    const animation = document.createElement('div');
    animation.className = 'reward-animation';
    animation.innerHTML = `
        <i class="fas fa-gift"></i>
        <span>+${amount} BTX</span>
    `;
    document.body.appendChild(animation);

    setTimeout(() => {
        animation.remove();
    }, 2000);
}

// Airdrop Functions
function updateAirdropStats() {
    // Get total participants
    firebase.database().ref('stats/totalUsers').once('value')
        .then((snapshot) => {
            const totalUsers = snapshot.val() || 0;
            document.getElementById('totalParticipants').textContent = totalUsers;
        });

    // Get total distributed
    firebase.database().ref('stats/totalDistributed').once('value')
        .then((snapshot) => {
            const totalDistributed = snapshot.val() || 0;
            document.getElementById('totalDistributed').textContent = `${totalDistributed.toFixed(2)} BTX`;
        });

    // Calculate next airdrop time
    const now = new Date();
    const nextAirdrop = new Date(now);
    nextAirdrop.setHours(24, 0, 0, 0);
    const timeUntilNext = nextAirdrop - now;
    
    const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilNext % (1000 * 60)) / 1000);
    
    document.getElementById('nextAirdrop').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function displayTopBalanceLeaderboard() {
    const topBalanceList = document.getElementById('topBalanceList');
    if (!topBalanceList) return;

    firebase.database().ref('leaderboards/topBalance')
        .orderByChild('balance')
        .limitToLast(10)
        .once('value')
        .then((snapshot) => {
            const users = [];
            snapshot.forEach((child) => {
                users.push(child.val());
            });
            users.reverse(); // Sort in descending order

            topBalanceList.innerHTML = users.map((user, index) => `
                <div class="leaderboard-item ${user.uid === userData.uid ? 'current-user' : ''}">
                    <span class="rank">#${index + 1}</span>
                    <span class="username">${user.username}</span>
                    <span class="amount">${user.balance.toFixed(2)} BTX</span>
                </div>
            `).join('');
        });
}

function claimAirdrop() {
    const today = new Date().toDateString();
    
    if (airdropState.lastClaimDate === today) {
        alert('You have already claimed your airdrop today. Come back tomorrow!');
        return;
    }

    airdropState.lastClaimDate = today;
    userData.balance += airdropState.dailyAmount;

    // Update user data in Firebase
    if (userData.uid) {
        const updates = {
            [`users/${userData.uid}/wallet/balance`]: userData.balance,
            [`users/${userData.uid}/airdrop/lastClaimDate`]: today,
            [`users/${userData.uid}/airdrop/totalClaims`]: (userData.airdrop?.totalClaims || 0) + 1,
            [`users/${userData.uid}/airdrop/totalEarnings`]: (userData.airdrop?.totalEarnings || 0) + airdropState.dailyAmount
        };

        firebase.database().ref().update(updates)
            .then(() => {
                // Add transaction
                const transaction = {
                    type: 'Airdrop',
                    amount: airdropState.dailyAmount,
                    date: new Date().toLocaleDateString(),
                    status: 'completed',
                    description: 'Daily airdrop claim'
                };

                firebase.database().ref(`users/${userData.uid}/transactions`).push(transaction);

                // Update leaderboard
                updateLeaderboards();
                
                // Update UI
                updateMiningUI();
                updateWalletUI();
                showRewardAnimation(airdropState.dailyAmount);
            })
            .catch((error) => {
                console.error('Error updating airdrop data:', error);
                alert('Failed to claim airdrop. Please try again.');
            });
    }
}

// Profile Modal Functions
function showAccountDetailsModal() {
    const modal = document.getElementById('accountDetailsModal');
    if (!modal) return;

    // Fill in existing user data
    const emailInput = modal.querySelector('#email');
    const fullNameInput = modal.querySelector('#fullName');
    const countryInput = modal.querySelector('#country');
    const ageInput = modal.querySelector('#age');

    if (emailInput) emailInput.value = userData.email || '';
    if (fullNameInput) fullNameInput.value = userData.fullName || '';
    if (countryInput) countryInput.value = userData.country || '';
    if (ageInput) ageInput.value = userData.age || '';

    // Show modal
    modal.style.display = 'block';
}

function handleAccountDetails(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const fullName = document.getElementById('fullName').value;
    const country = document.getElementById('country').value;
    const age = document.getElementById('age').value;

    if (!fullName || !country || !age) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Update user data
    userData.email = email;
    userData.fullName = fullName;
    userData.country = country;
    userData.age = age;

    // Save to Firebase
    if (userData.uid) {
        const updates = {
            [`users/${userData.uid}/account/email`]: email,
            [`users/${userData.uid}/account/fullName`]: fullName,
            [`users/${userData.uid}/account/country`]: country,
            [`users/${userData.uid}/account/age`]: parseInt(age)
        };

        firebase.database().ref().update(updates)
            .then(() => {
                showNotification('Account details updated successfully!', 'success');
                document.getElementById('accountDetailsModal').style.display = 'none';
            })
            .catch((error) => {
                console.error('Error updating account details:', error);
                showNotification('Failed to update account details. Please try again.', 'error');
            });
    }
}

// Leaderboard Functions
function updateLeaderboards() {
    if (!userData.uid) return;

    // Update top miners leaderboard
    const topMinersRef = firebase.database().ref('leaderboards/topMiners');
    topMinersRef.child(userData.uid).set({
        username: userData.username,
        totalMined: userData.totalMined,
        rank: 0 // Will be calculated by the server
    });

    // Update top balance leaderboard
    const topBalanceRef = firebase.database().ref('leaderboards/topBalance');
    topBalanceRef.child(userData.uid).set({
        username: userData.username,
        balance: userData.balance,
        rank: 0 // Will be calculated by the server
    });
}

function displayLeaderboards() {
    const leaderboardContainer = document.querySelector('.leaderboard-container');
    if (!leaderboardContainer) return;

    // Get top miners
    firebase.database().ref('leaderboards/topMiners')
        .orderByChild('totalMined')
        .limitToLast(10)
        .once('value')
        .then((snapshot) => {
            const miners = [];
            snapshot.forEach((child) => {
                miners.push(child.val());
            });
            miners.reverse(); // Sort in descending order

            // Update top miners display
            const topMinersList = document.getElementById('topMinersList');
            if (topMinersList) {
                topMinersList.innerHTML = miners.map((miner, index) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${index + 1}</span>
                        <span class="username">${miner.username}</span>
                        <span class="amount">${miner.totalMined.toFixed(2)} BTX</span>
                    </div>
                `).join('');
            }
        });

    // Get top balance
    firebase.database().ref('leaderboards/topBalance')
        .orderByChild('balance')
        .limitToLast(10)
        .once('value')
        .then((snapshot) => {
            const balances = [];
            snapshot.forEach((child) => {
                balances.push(child.val());
            });
            balances.reverse(); // Sort in descending order

            // Update top balance display
            const topBalanceList = document.getElementById('topBalanceList');
            if (topBalanceList) {
                topBalanceList.innerHTML = balances.map((user, index) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${index + 1}</span>
                        <span class="username">${user.username}</span>
                        <span class="amount">${user.balance.toFixed(2)} BTX</span>
                    </div>
                `).join('');
            }
        });
}

// Event Listeners
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(item.dataset.section);
    });
});

walletButtons.forEach(button => {
    button.addEventListener('click', () => {
        showSection('wallet');
    });
});

miningButton.addEventListener('click', startMining);
collectDailyRewardBtn.addEventListener('click', collectDailyReward);
claimAirdropBtn.addEventListener('click', claimAirdrop);
showAccountDetailsBtn.addEventListener('click', showAccountDetailsModal);

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        signUpModal.style.display = 'none';
        if (accountDetailsModal) {
            accountDetailsModal.style.display = 'none';
        }
    });
});

accountDetailsForm.addEventListener('submit', handleAccountDetails);
signInForm.addEventListener('submit', handleSignIn);
signUpForm.addEventListener('submit', handleSignUp);
googleSignInBtn.addEventListener('click', handleGoogleSignIn);

showSignUpBtn.addEventListener('click', () => {
    signUpModal.style.display = 'block';
});

showWhitePaperBtn.addEventListener('click', () => {
    window.open('https://biotrex.com/whitepaper', '_blank');
});

showCustomerServiceBtn.addEventListener('click', () => {
    window.open('https://biotrex.com/support', '_blank');
});

logoutButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        showSection('auth');
    }
});

depositBtn.addEventListener('click', () => {
    const depositModal = document.getElementById('depositModal');
    depositModal.classList.add('active');
});

withdrawBtn.addEventListener('click', () => {
    const withdrawModal = document.getElementById('withdrawModal');
    withdrawModal.classList.add('active');
});

// Error handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.form-container form');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === signUpModal) {
        signUpModal.style.display = 'none';
    }
});

// Password toggle functionality
document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        default:
            return 'fa-info-circle';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            firebase.database().ref(`users/${user.uid}`).once('value')
                .then((snapshot) => {
                    const userInfo = snapshot.val();
                    if (userInfo) {
                        Object.assign(userData, userInfo);
                        userData.uid = user.uid;
                        showSection('mining');
                        updateMiningUI();
                        updateWalletUI();
                        updateSevenDaysRewardUI();
                        initializeMiningState();
                    }
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                    showSection('auth');
                });
        } else {
            // User is signed out
            showSection('auth');
        }
    });

    // Add this to display leaderboards when the page loads
    displayLeaderboards();
    
    // Set up real-time updates for leaderboards
    firebase.database().ref('leaderboards').on('value', () => {
        displayLeaderboards();
    });

    // Update airdrop stats every second
    setInterval(updateAirdropStats, 1000);
    
    // Display leaderboard
    displayTopBalanceLeaderboard();
    
    // Set up real-time updates for leaderboard
    firebase.database().ref('leaderboards/topBalance').on('value', () => {
        displayTopBalanceLeaderboard();
    });
});

// Add this to your initialization code
async function initializeMiningState() {
    if (userData.uid) {
        try {
            const miningSnapshot = await firebase.database().ref(`users/${userData.uid}/mining`).once('value');
            const miningData = miningSnapshot.val();

            if (miningData && miningData.isMining) {
                const startTime = miningData.startTime;
                const cycleEndTime = miningData.cycleEndTime;
                const currentTime = Date.now();

                // If mining cycle hasn't ended, resume mining
                if (currentTime < cycleEndTime) {
                    // Calculate and update balance for the time the app was closed
                    const elapsedTime = currentTime - startTime;
                    const minedAmount = (elapsedTime / (1000 * 60 * 60)) * userData.miningRate;
                    userData.balance = parseFloat(minedAmount.toFixed(2));
                    userData.totalMined = parseFloat((userData.totalMined + minedAmount).toFixed(2));

                    // Update Firebase with new balance
                    await firebase.database().ref(`users/${userData.uid}/wallet`).update({
                        balance: userData.balance,
                        totalMined: userData.totalMined
                    });

                    // Update UI and resume mining
                    miningButton.innerHTML = `
                        <i class="fas fa-stop"></i>
                        <span>Stop Mining</span>
                    `;
                    miningButton.classList.add('mining');
                    userData.lastMiningTime = startTime;
                    startMiningTimer(startTime, cycleEndTime);
                } else {
                    // If mining cycle has ended, stop mining
                    await stopMining();
                }
            }
        } catch (error) {
            console.error('Error initializing mining state:', error);
            showNotification('Failed to load mining state. Please try again.', 'error');
        }
    }
}

// Update user data initialization
async function initializeUserData(user) {
    try {
        const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userInfo = snapshot.val();

        if (userInfo) {
            // Update local state
            Object.assign(userData, userInfo);
            userData.uid = user.uid;

            // Initialize UI
            showSection('mining');
            updateMiningUI();
            updateWalletUI();
            updateSevenDaysRewardUI();
            
            // Initialize mining state
            await initializeMiningState();
        } else {
            // Create new user data if it doesn't exist
            const newUserData = {
                account: {
                    email: user.email,
                    username: user.displayName || user.email.split('@')[0],
                    createdAt: new Date().toISOString()
                },
                wallet: {
                    balance: 0,
                    totalMined: 0,
                    miningRate: 0.75
                },
                mining: {
                    isMining: false,
                    startTime: null,
                    lastUpdateTime: null,
                    cycleEndTime: null
                },
                rewards: {
                    currentDay: 0,
                    lastCollectionDate: null,
                    completedDays: {},
                    totalRewards: 0
                },
                airdrop: {
                    lastClaimDate: null,
                    totalClaims: 0,
                    totalEarnings: 0
                },
                transactions: {}
            };

            await firebase.database().ref(`users/${user.uid}`).set(newUserData);
            Object.assign(userData, newUserData);
            userData.uid = user.uid;
        }
    } catch (error) {
        console.error('Error initializing user data:', error);
        showNotification('Failed to load user data. Please try again.', 'error');
    }
}

// Update the auth state change listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        initializeUserData(user);
    } else {
        showSection('auth');
    }
}); 