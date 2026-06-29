import Worldmap from './Worldmap';

export default function TravelView({ myPlayer }) {
    const currentShip = myPlayer?.currentShip;
    const waypoints = currentShip?.activeRouteWaypoints || [];

    return (
        <div className="travel-container card">
            <div className="card-header">
                <h2>Ship at Sea</h2>
                {currentShip && <span>{currentShip.name}</span>}
            </div>
            <p>Captain {myPlayer.name} is en route to the destination port.</p>

            <Worldmap 
               ports={[]}
               routeWaypoints={waypoints} 
               shipState={currentShip} 
            />
        </div>
    );
}