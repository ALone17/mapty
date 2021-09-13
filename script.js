'use strict';






class Workout {
    date = new Date();
    id = Date.now() + ''.slice(-10);


    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}


class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.paceCalc();
        this._setDescription();
    }

    paceCalc() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, ElevationGain) {
        super(coords, distance, duration);
        this.ElevationGain = ElevationGain;
        this.speedCalc();
        this._setDescription();
    }

    speedCalc() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}





/////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
//Archetecture App
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const form_sort = document.querySelector('.form__sort');
const btn_DEAD = document.querySelector('.remove--all__btn');
const btn_sort = document.querySelector('.sort--all__btn');
const sidebar = document.querySelector('.sidebar');


class App {

    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    #marker = [];

    constructor() {
        //Get user's position
        this._getPosition();

        //Get data from local storage
        this._getLocalStorage();
        //Attach event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggelElevetionField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        sidebar.addEventListener('click', this._initRemoveBtn.bind(this));

    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
                function () {
                    alert('Не могу получить месторасположение');
                });


        }
    }

    _loadMap(pos) {
        const { latitude, longitude } = pos.coords;
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
        // console.log(this);
        this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        //Handling click map
        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
        // show btn after load
        this._ControllShowWorkouts(this.#workouts);
    }

    _showForm(mapE) {
        this.#mapEvent = mapE.latlng;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        // Empty inputs
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';
        inputDistance.blur();
        inputDuration.blur();
        inputCadence.blur();
        inputElevation.blur();
        inputType.blur();

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);

    }

    _toggelElevetionField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();

        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        //Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent;
        let workout;

        //If workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            //Check if data is valid
            if (
                // !Number.isFinite(distance)
                //     || !Number.isFinite(duration)
                //     || !Number.isFinite(cadence)
                !validInputs(duration, distance, cadence) || !allPositive(duration, distance, cadence))
                return alert('Inputs have to be positive numbers!');

            workout = new Running([lat, lng], distance, duration, cadence);

        }
        //If workout cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(duration, distance, elevation) || !allPositive(duration, distance))
                return alert('Inputs have to be positive numbers!');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        //Add new object to workout array
        this.#workouts.push(workout);
        // Show btn after add new workout
        this._ControllShowWorkouts(this.#workouts);

        //Render workout on map as marker
        this._renderWorkoutMarker(workout);
        //Render workout on list
        this._renderWorkout(workout);
        //Hide form and clear input fields
        this._hideForm();
        //Set local storage to all workouts
        this._setLocalStorage();

    }

    _renderWorkoutMarker(workout) {

        const a = L.marker(workout.coords).addTo(this.#map)
        a.bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type}-popup` }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`)
            .openPopup();
        this.#marker.push(a);
    }

    _renderWorkout(workout) {
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workout.type === 'running') {
            html += `  
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
        <button class= "remove__btn">Remove</button>
        <button class= "edit__btn">Edit</button>
    </li>`
        }
        if (workout.type === 'cycling') {
            html += `  
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.ElevationGain}</span>
            <span class="workout__unit">m</span>
        </div>
        <button class= "remove__btn">Remove</button>
        <button class= "edit__btn">Edit</button>
    </li>`
        }
        form.insertAdjacentHTML('afterend', html);

    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if (e.target.classList.contains('remove__btn')) return;

        if (e.target.classList.contains('edit__btn')) return;

        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, { animate: true, pan: { duration: 1 } });
    }

    _setLocalStorage() {
        console.log(this.#workouts);
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if (!data) return;
        const CorrectTypeData = [];
        data.forEach(work => {
            const corrData = work.type === 'running' ?
                new Running(work.coords, work.distance, work.duration, work.cadence) : new Cycling(work.coords, work.distance, work.duration, work.ElevationGain);
            corrData.date = work.date;
            corrData.id = work.id;
            corrData.description = work.description;
            CorrectTypeData.push(corrData);
        });

        this.#workouts = CorrectTypeData;
        this.#workouts.forEach(work => this._renderWorkout(work));
    }
    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }

    //Init button workout
    _initRemoveBtn(e) {
        if (e.target.classList.contains('remove__btn')) this._removeWorkout(e);
        if (e.target.classList.contains('edit__btn')) this._editWorkout(e);
        if (e.target.classList.contains('remove--all__btn')) this._removeAllWorkouts();
        if (e.target.classList.contains('sort--all__btn')) this._sorthWorkouts();
    }

    // Remove function
    _removeWorkout(e) {
        const idRemove = e.target.closest('.workout').dataset.id;
        this.#workouts.forEach((work, i) => {
            if (work.id === idRemove) {
                this.#workouts.splice(i, 1);
                this.#marker[i].remove();
                this.#marker.splice(i, 1);
            }
        });
        this._setLocalStorage();
        e.target.closest('.workout').remove();
        console.log(this.#workouts);


        // hide btn after delete workout
        this._ControllShowWorkouts(this.#workouts);
    }

    //Edit function
    _editWorkout(e) {
        const curId = e.target.closest('.workout').dataset.id;
        console.log(curId);
        const [curWork] = this.#workouts.filter(work => work.id === curId);
        const latlng = {
            latlng: {
                lat: curWork.coords[0],
                lng: curWork.coords[1],
            }
        };
        inputDistance.value = `${curWork.distance}`;
        inputDuration.value = `${curWork.duration}`;
        inputCadence.value = curWork.cadence ? `${curWork.cadence}` : '';
        inputElevation.value = curWork.ElevationGain ? `${curWork.ElevationGain}` : '';
        if (inputType.value !== curWork.type) {
            this._toggelElevetionField();
            inputType.value = curWork.type;
        }
        this._showForm(latlng)

        this._removeWorkout(e);
    }

    _removeAllWorkouts() {
        this.#workouts = [];
        this.#marker.forEach(mark => mark.remove());
        this._setLocalStorage();
        console.log('worked!');
        containerWorkouts.querySelectorAll('.workout').forEach(el => el.remove());
        btn_DEAD.style.display = 'none';
        btn_sort.style.display = 'none';
        form_sort.style.display = 'none';
    }

    _sorthWorkouts() {
        let sortArr = []
        this.#workouts.forEach(el => sortArr.push(el));
        sortArr.sort((a, b) => a[`${form_sort.value}`] - b[`${form_sort.value}`]);
        console.log(form_sort.value);
        console.log(this.#workouts);
        containerWorkouts.querySelectorAll('.workout').forEach(el => el.remove());
        if (form_sort.value !== 'data') sortArr.forEach(el => this._renderWorkout(el));
        if (form_sort.value === 'data') this.#workouts.forEach(el => this._renderWorkout(el));

    }

    _ControllShowWorkouts(workouts) {
        [btn_DEAD, btn_sort, form_sort].forEach(el => {
            workouts.length > 1 ? el.style.display = 'block' : el.style.display = 'none';
        });
    }

}


const app = new App();



