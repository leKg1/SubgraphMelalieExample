import { BigInt,log } from "@graphprotocol/graph-ts"
import {
  Melalie,
  Approval,
  OwnershipTransferred,
  Paused,
  RewardWithdrawn,
  RewardsDistributed,
  StakeCreated,
  StakeRemoved,
  Transfer,
  Unpaused
} from "../generated/Melalie/Melalie"
import { MelaliePerDay, MelaliePerHour } from "../generated/schema"

/**
 * Sets missing days to the last found value
 */
export function findAndUpdateMissingDays(dayId: i32): void {

    //1. loop backwards and find the last day with data
    const firstDayId = 1627537119 / 86400; //is calculated by the timestamp of the contract creation  
    let currentDayId = dayId;
    let foundLastDayWithData =  0;
    let foundLastData = BigInt.fromI32(0)

    log.debug(`looping backward in order to find the last day with data`, [])
    while(true){
      currentDayId--;
      let currentPerDay = MelaliePerDay.load(BigInt.fromI32(currentDayId).toString());
      if(currentPerDay === null){
        log.debug(`loading currentDayId ${currentDayId} was not successful creating new!`, [])
        currentPerDay = new MelaliePerDay(BigInt.fromI32(currentDayId).toString())
        currentPerDay.totalStake =  BigInt.fromI32(0);
        currentPerDay.stakeRemovedCount = BigInt.fromI32(0);
        currentPerDay.stakeRemovedSum =  BigInt.fromI32(0);
        currentPerDay.stakeCreatedCount = BigInt.fromI32(0);
        currentPerDay.stakeCreatedSum =  BigInt.fromI32(0);
        currentPerDay.totalRewards = BigInt.fromI32(0);
        currentPerDay.totalDistributions =  BigInt.fromI32(0);

        currentPerDay.save(); //maybe this? usually not here - what you mean usually? are we doing anything usual ritht now? 
      // i mean here we initialize, yes but if we don't save, then it cannot be found later. i would save at end. this is the end of the first loop, ok, let's try this
      }
      if(currentPerDay.totalStake !== null){ //as soon as we find data while walking backwards, we take this data and remember it as foundLastData 
        log.debug(`loading totalStake ${currentDayId} successful was: ${currentPerDay.totalStake}`, [])
        foundLastDayWithData = currentDayId;
        foundLastData = currentPerDay.totalStake;
      }
      if(currentDayId<firstDayId) {
        log.debug(`never found currentDayId ${currentDayId} - exiting loop`, [])
        break;     
      }   
    }
    //2. loop forward from the last day with data until current dayId and set those data with the last data
    currentDayId = dayId; //resettting currentDayId otherwise nothing will loop forward
    log.debug(`looping forward`, [])
    for(let d = foundLastDayWithData;d<currentDayId;d++){
      let currentPerDay = MelaliePerDay.load(BigInt.fromI32(d).toString());
      
      if(currentPerDay === null){
        log.debug(`loading currentDayId ${currentDayId} was not successful creating new!`, [])
        currentPerDay = new MelaliePerDay(BigInt.fromI32(d).toString())
        currentPerDay.totalStake =  BigInt.fromI32(0);
      }
      log.debug(`currentDayId ${currentDayId} has totalStake ${foundLastData} of last day with data ${foundLastDayWithData}!`, [])
      currentPerDay.totalStake = foundLastData
      currentPerDay.save();
    }   
}

export function handleStakeCreated(event: StakeCreated): void {
  let melalie = Melalie.bind(event.address)
  const timestamp = event.block.timestamp.toI32();
  const dayId = timestamp / 86400;
  const hourId = timestamp / 3600;

  // Stakes per day
  let melaliePerDay = MelaliePerDay.load(BigInt.fromI32(dayId).toString());
  if(melaliePerDay === null){
      melaliePerDay = new MelaliePerDay(BigInt.fromI32(dayId).toString());
      melaliePerDay.stakeCreatedCount = BigInt.fromI32(0);
      melaliePerDay.stakeCreatedSum =  BigInt.fromI32(0);
      melaliePerDay.stakeRemovedCount = BigInt.fromI32(0);
      melaliePerDay.stakeRemovedSum =  BigInt.fromI32(0);
      melaliePerDay.totalStake =  BigInt.fromI32(0);

      melaliePerDay.totalRewards = BigInt.fromI32(0);
      melaliePerDay.totalDistributions =  BigInt.fromI32(0);
  }

  melaliePerDay.stakeCreatedSum = melaliePerDay.stakeCreatedSum.plus(event.params._stake);
  melaliePerDay.stakeCreatedCount = melaliePerDay.stakeCreatedCount.plus(BigInt.fromI32(1));
  
  // findAndUpdateMissingDays(dayId)   
  //TODO maybe later
  // melaliePerDay.totalStake = melalie.totalStakes();
  melaliePerDay.save();

  // Stakes per hour
  // let stakePerHour = MelaliePerHour.load(BigInt.fromI32(hourId).toString());
  // if(stakePerHour === null){
  //     stakePerHour = new MelaliePerHour(BigInt.fromI32(hourId).toString());
  //     stakePerHour = new MelaliePerHour(" ");
  //     stakePerHour.stakeCreatedCount = BigInt.fromI32(0);
  //     stakePerHour.stakeCreatedSum =  BigInt.fromI32(0);
  //     stakePerHour.stakeRemovedCount = BigInt.fromI32(0);
  //     stakePerHour.stakeRemovedSum =  BigInt.fromI32(0);
  // }
  // stakePerHour.stakeCreatedSum = stakePerHour.stakeCreatedSum.plus(event.params._stake);
  // stakePerHour.stakeCreatedCount = stakePerHour.stakeCreatedCount.plus(BigInt.fromI32(1));
  // stakePerHour.save();

}

export function handleStakeRemoved(event: StakeRemoved): void {
  let melalie = Melalie.bind(event.address)
  const timestamp = event.block.timestamp.toI32();
  const dayId = timestamp / 86400;
  const hourId = timestamp / 3600;
4
  let melaliePerDay = MelaliePerDay.load(BigInt.fromI32(dayId).toString());
  if(melaliePerDay === null){
      melaliePerDay = new MelaliePerDay(BigInt.fromI32(dayId).toString());
      melaliePerDay.stakeRemovedCount = BigInt.fromI32(0);
      melaliePerDay.stakeRemovedSum =  BigInt.fromI32(0);
      melaliePerDay.stakeCreatedCount = BigInt.fromI32(0);
      melaliePerDay.stakeCreatedSum =  BigInt.fromI32(0);
      melaliePerDay.totalStake =  BigInt.fromI32(0);

      melaliePerDay.totalRewards = BigInt.fromI32(0);
      melaliePerDay.totalDistributions =  BigInt.fromI32(0);
  }
  melaliePerDay.stakeRemovedSum = melaliePerDay.stakeRemovedSum.plus(event.params._stake);
  melaliePerDay.stakeRemovedCount = melaliePerDay.stakeRemovedCount.plus(BigInt.fromI32(1));

    //TODO maybe later
  // findAndUpdateMissingDays(dayId)  
  // melaliePerDay.totalStake = melalie.totalStakes();
  melaliePerDay.save();

  // let stakeRemovedPerHour = MelaliePerHour.load(BigInt.fromI32(hourId).toString());
  // if(stakeRemovedPerHour === null){
  //   stakeRemovedPerHour = new MelaliePerHour(BigInt.fromI32(hourId).toString());
  //   stakeRemovedPerHour.stakeRemovedCount = BigInt.fromI32(0);
  //   stakeRemovedPerHour.stakeRemovedSum =  BigInt.fromI32(0);
  //   stakeRemovedPerHour.stakeCreatedCount = BigInt.fromI32(0);
  //   stakeRemovedPerHour.stakeCreatedSum =  BigInt.fromI32(0);
  // }
  // stakeRemovedPerHour.stakeRemovedSum = stakeRemovedPerHour.stakeRemovedSum.plus(event.params._stake);
  // stakeRemovedPerHour.stakeRemovedCount = stakeRemovedPerHour.stakeRemovedCount.plus(BigInt.fromI32(1));
  // stakeRemovedPerHour.save();
}

export function handleRewardsDistributed(event: RewardsDistributed): void {
  let melalie = Melalie.bind(event.address)
  const timestamp = event.block.timestamp.toI32();
  const dayId = timestamp / 86400;
  const hourId = timestamp / 3600;

  let melaliePerDay = MelaliePerDay.load(BigInt.fromI32(dayId).toString());
  if(melaliePerDay === null){
      melaliePerDay = new MelaliePerDay(BigInt.fromI32(dayId).toString());
      melaliePerDay.totalRewards = BigInt.fromI32(0);
      melaliePerDay.totalDistributions =  BigInt.fromI32(0);

      melaliePerDay.stakeRemovedCount = BigInt.fromI32(0);
      melaliePerDay.stakeRemovedSum =  BigInt.fromI32(0);
      melaliePerDay.stakeCreatedCount = BigInt.fromI32(0);
      melaliePerDay.stakeCreatedSum =  BigInt.fromI32(0);
      melaliePerDay.totalStake =  BigInt.fromI32(0);
  }

  melaliePerDay.totalRewards = melalie.totalRewards() //melaliePerDay.totalRewards.plus(melalie.totalRewards());
  melaliePerDay.totalDistributions = melalie.totalDistributions() //melaliePerDay.totalDistributions.plus(melalie.totalDistributions());
  melaliePerDay.totalStake = melalie.totalStakes();

  melaliePerDay.save();
}

export function handleApproval(event: Approval): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePaused(event: Paused): void {}

export function handleRewardWithdrawn(event: RewardWithdrawn): void {}

export function handleTransfer(event: Transfer): void {}

export function handleUnpaused(event: Unpaused): void {}
