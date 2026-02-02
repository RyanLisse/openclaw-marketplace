// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Marketplace
 * @notice Core marketplace for OpenClaw intents.
 * @dev Handles escrow, intent lifecycle, and disputes. Upgradeable.
 */
contract Marketplace is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable, 
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    enum IntentStatus { Active, InProgress, Completed, Cancelled, Disputed }

    struct Intent {
        address creator;
        address token;
        uint256 amount;
        string metadataURI;
        address provider;
        IntentStatus status;
        uint256 createdAt;
    }

    mapping(uint256 => Intent) public intents;
    uint256 private _nextIntentId;

    event IntentCreated(uint256 indexed intentId, address indexed creator, address token, uint256 amount, string metadataURI);
    event IntentAssigned(uint256 indexed intentId, address indexed provider);
    event IntentCompleted(uint256 indexed intentId);
    event IntentCancelled(uint256 indexed intentId);
    event IntentDisputed(uint256 indexed intentId);
    event IntentResolved(uint256 indexed intentId, address recipient, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin, address upgrader) initializer public {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, upgrader);
        _grantRole(ARBITRATOR_ROLE, defaultAdmin);
    }

    // --- Intent Lifecycle ---

    function createIntent(address token, uint256 amount, string memory metadataURI) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        
        // Escrow funds
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 intentId = _nextIntentId++;
        intents[intentId] = Intent({
            creator: msg.sender,
            token: token,
            amount: amount,
            metadataURI: metadataURI,
            provider: address(0),
            status: IntentStatus.Active,
            createdAt: block.timestamp
        });

        emit IntentCreated(intentId, msg.sender, token, amount, metadataURI);
        return intentId;
    }

    function assignProvider(uint256 intentId, address provider) external {
        Intent storage intent = intents[intentId];
        require(msg.sender == intent.creator, "Only creator can assign");
        require(intent.status == IntentStatus.Active, "Intent not active");
        require(provider != address(0), "Invalid provider");

        intent.provider = provider;
        intent.status = IntentStatus.InProgress;

        emit IntentAssigned(intentId, provider);
    }

    function completeIntent(uint256 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        require(msg.sender == intent.creator, "Only creator can complete");
        require(intent.status == IntentStatus.InProgress, "Intent not in progress");

        intent.status = IntentStatus.Completed;
        // Release funds to provider
        IERC20(intent.token).safeTransfer(intent.provider, intent.amount);

        emit IntentCompleted(intentId);
    }

    function cancelIntent(uint256 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        require(msg.sender == intent.creator, "Only creator can cancel");
        // Can only cancel if Active (Funds returned) or InProgress (Requires mutual agreement? Or strictly checks?)
        // For simplicity: Only Active allows unilateral cancellation.
        require(intent.status == IntentStatus.Active, "Cannot cancel if InProgress");

        intent.status = IntentStatus.Cancelled;
        IERC20(intent.token).safeTransfer(intent.creator, intent.amount);

        emit IntentCancelled(intentId);
    }

    // --- Disputes ---

    function disputeIntent(uint256 intentId) external {
        Intent storage intent = intents[intentId];
        require(intent.status == IntentStatus.InProgress, "Intent not in progress");
        require(msg.sender == intent.creator || msg.sender == intent.provider, "Only participants can dispute");

        intent.status = IntentStatus.Disputed;
        emit IntentDisputed(intentId);
    }

    function resolveDispute(uint256 intentId, address winner) external onlyRole(ARBITRATOR_ROLE) nonReentrant {
        Intent storage intent = intents[intentId];
        require(intent.status == IntentStatus.Disputed, "Intent not disputing");
        require(winner == intent.creator || winner == intent.provider, "Winner must be participant");

        intent.status = IntentStatus.Completed; // Resolved
        IERC20(intent.token).safeTransfer(winner, intent.amount);

        emit IntentResolved(intentId, winner, intent.amount);
    }

    // --- Upgrades ---

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}
