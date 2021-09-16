'use strict';






class Workout {
    date = new Date();
    id = Date.now() + ''.slice(-10);
    type_draw = type_draw.value;


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
const type_draw = document.querySelector('.type_draw');
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
const show_all_btn = document.querySelector('.show--all__btn');


class App {

    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    #curworkout;
    #marker = [];
    #circle = [];
    #line = [];
    #temporarymarker;

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
        [inputCadence, inputDistance, inputDuration, inputElevation].forEach(el =>
            el.addEventListener('click', function () {
                if (document.querySelector('.errorMessage')) { document.querySelector('.errorMessage').remove(); }
            }));

    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), this._errorMessage.bind(this));


        }
    }

    _errorMessage(errGeo) {
        if (errGeo) {
            document.querySelector('#map').insertAdjacentHTML('afterbegin', '<span class="errorMessage">Не могу получить месторасположение.</br><b> Нет доступа к геоданным</span>');
            console.error(`Не могу получить месторасположение.Нет доступа к геоданным ${errGeo.message}`);
        }
        if (!errGeo && (!document.querySelector('.errorMessage'))) {
            form.insertAdjacentHTML('afterend', '<span class="errorMessage">Ввод должен быть позитивным числом!</span>');
            document.querySelector('.errorMessage').style.left = '3%';
            document.querySelector('.errorMessage').style.top = '15%';
            inputType.focus();
        }
        if (document.querySelector('.errorMessage')) return;

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
        if (form.classList.contains('hidden')) this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
            console.log(work.line_coord);
            work.type_draw === 'Circle' ?
                this._renderWorkoutMarker(work) : this._renderWorkoutLine(null, work.line_coord);
        });
        // show btn after load
        this._ControllShowWorkouts(this.#workouts);


    }

    _showForm(mapE) {
        if (form.classList.contains('hidden')) this.#mapEvent = mapE.latlng;
        console.log(this.#mapEvent);
        // console.log(form.closest('.form'));
        form.classList.remove('hidden');
        type_draw.classList.remove('hidden');
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
        type_draw.classList.add('hidden');
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
                return this._errorMessage();

            workout = new Running([lat, lng], distance, duration, cadence);
            this.#curworkout = workout;

        }
        //If workout cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(duration, distance, elevation) || !allPositive(duration, distance))
                return this._errorMessage();

            workout = new Cycling([lat, lng], distance, duration, elevation);
            this.#curworkout = workout;
        }
        //Add new object to workout array
        this.#workouts.push(workout);
        // Show btn after add new workout
        this._ControllShowWorkouts(this.#workouts);

        //Render workout on map as marker or line
        if (workout.type_draw === 'Circle') this._renderWorkoutMarker(workout)
        if (workout.type_draw === 'Line') {
            this.#map.off('click');
            this.#map.on('click', this._renderWorkoutLine.bind(this));
        }

        //Render workout on list
        this._renderWorkout(workout);
        //Hide form and clear input fields
        this._hideForm();
        //Set local storage to all workouts
        this._setLocalStorage();

    }

    _renderWorkoutMarker = async function (workout) {
        const prom = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${workout.coords[0]}&longitude=${workout.coords[1]}&localityLanguage=ru `);
        const res = await prom.json();
        console.log(res);
        const a = L.marker(workout.coords).addTo(this.#map)
        a.bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type}-popup` }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description} Run in ${res.city ? res.city : res.locality}, ${res.countryName}`);
        // .openPopup()
        this.#marker.push(a);
        const latlng = [workout.coords];
        const lineTest = L.circle(...latlng, { radius: (workout.distance / 2) * 100, color: 'green' }).addTo(this.#map);
        this.#circle.push(lineTest);
    }

    // Create line on map
    _renderWorkoutLine(mapE, work) {

        if (mapE) {
            if (this.#temporarymarker) this.#temporarymarker.remove();
            const { lat, lng } = mapE.latlng;
            this.#line.push([lat, lng]);
            this.#temporarymarker = L.marker([lat, lng]).addTo(this.#map)
        }

        if (this.#line.length === 2) {
            const a = L.polyline(this.#line).addTo(this.#map);
            this.#marker.push(a);
            this.#workouts.forEach(work => {
                if (this.#curworkout.id === work.id) work.line_coord = this.#line;
            });
            this._setLocalStorage();
            this.#line = [];
            this.#map.off('click');
            this.#map.on('click', this._showForm.bind(this));
            const delmark = marker => marker.remove();
            setTimeout(delmark, 300, this.#temporarymarker);
        }

        if (work) {
            const a = L.polyline(work).addTo(this.#map);
            this.#marker.push(a);
        }
    }



    _renderWorkout = async function (workout) {
        const weater = await this.weather(...workout.coords);
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
        <div> Погода : ${weater} </div>
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
        <div> Погода : ${weater} </div>
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
            corrData.type_draw = work.type_draw;
            corrData.line_coord = work.line_coord;
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
        if (e.target.classList.contains('show--all__btn') && this.#map) this._showAllWorkouts();
        return;
    }

    // Remove function
    _removeWorkout(e) {
        const idRemove = e.target.closest('.workout').dataset.id;
        this.#workouts.forEach((work, i) => {
            if (work.id === idRemove) {
                this.#workouts.splice(i, 1);
                this.#marker[i].remove();
                this.#marker.splice(i, 1);
                if (work.type_draw === 'Circle') {
                    this.#circle[i].remove();
                    this.#circle.splice(i, 1);
                }
            }
        });
        this._setLocalStorage();
        e.target.closest('.workout').remove();


        // hide btn after delete workout
        this._ControllShowWorkouts(this.#workouts);
    }

    //Edit function
    _editWorkout(e) {
        const curId = e.target.closest('.workout').dataset.id;
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
        this.#marker = [];
        this.#circle.forEach(mark => mark.remove());
        this.#circle = [];
        this._setLocalStorage();
        containerWorkouts.querySelectorAll('.workout').forEach(el => el.remove());
        this._ControllShowWorkouts(this.#workouts);
    }

    _sorthWorkouts() {
        let sortArr = []
        this.#workouts.forEach(el => sortArr.push(el));
        sortArr.sort((a, b) => a[`${form_sort.value}`] - b[`${form_sort.value}`]);
        containerWorkouts.querySelectorAll('.workout').forEach(el => el.remove());
        if (form_sort.value !== 'data') sortArr.forEach(el => this._renderWorkout(el));
        if (form_sort.value === 'data') this.#workouts.forEach(el => this._renderWorkout(el));

    }

    // Позиционирует карту на все тренировки
    _showAllWorkouts() {
        const coords = this.#workouts.map(work => work.coords);
        this.#map.fitBounds(coords)
    }

    _ControllShowWorkouts(workouts) {
        [btn_DEAD, btn_sort, form_sort, show_all_btn].forEach(el => {
            workouts.length > 1 ? el.style.display = 'block' : el.style.display = 'none';
        });
    }


    weather = async function (lat, lng) {
        const weat = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m`);
        const res = await weat.json();
        const indexTime = res.hourly.time.findIndex((data) => new Date(data).getTime() >= new Date().getTime());
        return `${new Intl.DateTimeFormat('ru-RU', {
            hour: 'numeric',
            minute: 'numeric',
            day: 'numeric',
            month: 'long'
        }).format(new Date(res.hourly.time[indexTime]))}: ${res.hourly.temperature_2m[indexTime]}${res.hourly_units.temperature_2m} `;

    }

}


const app = new App();




