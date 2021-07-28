export class Timestream {
	public static readonly WORLD_ROOT_KEY = "WORLD_ROOT_TIMESTREAM";
	/** 
	 * TODO: Define "channels" here that are individual subsections of this timestream.
	 * The main channel determines the flow of time for the world, with
	 * individual channels acting as groupings that let me modify the flow of
	 * relative time for objects on that channel. It is important to note that,
	 * like a river, you have to trace a channel back to the source to determine
	 * the actual time factor.
	 * For instance, suppose a game world is running at triple speed due to a
	 * difficult game mode, but the player activates an item that slows down the
	 * speed of enemy ships by half. There are 2 distinct channels, one for the
	 * player that has a 1x modifier to the timeFactor, and one for the enemies
	 * that has a .5x modifier to the timeFactor. Both are branched off of the
	 * world channel which has the 3x multiplier, so to determine their actual
	 * timeFactor you trace back to the world channel, multiplying the current
	 * timeFactor by each new one encountered. The player ends up with a 3x
	 * timeFactor and the enemy ships end up with a 1.5x timeFactor.
	 *
	 * Could this be accomplished better with groups? A collection of sets or something?
	 */
	allTimeChannels: Map<string, TimeFactorNode>;

	constructor() {
		this.allTimeChannels = new Map<string, TimeFactorNode>();
		this.allTimeChannels.set(Timestream.WORLD_ROOT_KEY, new TimeFactorNode(null, 1));
	}

	public getWorldRootTimestream(): TimeFactorNode {
		return this.allTimeChannels.get(Timestream.WORLD_ROOT_KEY);
	}

	public makeNewBranch(branchName: string, parentBranchName: string, timeModifier: number): TimeFactorNode {
		// If the parent branch does not exist or this branch already does exist, don't add this.
		if(this.allTimeChannels.has(parentBranchName) == false || this.allTimeChannels.has(branchName)) {
			return null;
		} else {
			let factorNode = new TimeFactorNode(this.allTimeChannels.get(parentBranchName), timeModifier);
			this.allTimeChannels.set(branchName, factorNode);
			return factorNode;
		}
	}

	/**
	 * Adding objects to a channel is as simple as pulling the TimeFactorNode
	 * out of allChannels and using it as their TimeFactorNode.
	 * Creating a new 
	 */
}

export class TimeFactorNode {
	previous: TimeFactorNode;
	/**
	 * The multiplier this channel applies to effective time.
	 * TODO: Determine if I have to enforce positivity here?
	 * Can I rewind motions that are scripted? I know I can't rewind the player
	 * because their actions are discarded every tick. Something to think about
	 * in the future if I ever want to add a "Sands of Time" or "Braid" styled
	 * feature.
	 */
	timeModifier: number;

	constructor(previous: TimeFactorNode, timeModifier: number) {
		this.previous = previous;
		this.timeModifier = timeModifier
	}

	public getPrevious(): TimeFactorNode {
		return this.previous;
	}

	public setPrevious(previous: TimeFactorNode) {
		this.previous = previous;
	}

	public getTimeModifier(): number {
		return this.timeModifier;
	}

	public setTimeModifier(timeModifier: number) {
		this.timeModifier = timeModifier;
	}

	public getTimeFactor(): number {
		if(this.previous === null) {
			return this.getTimeModifier();
		} else {
			return this.getTimeModifier() * this.previous.getTimeFactor();
		}
	}
}