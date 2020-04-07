const InitialState = () =>  {

	return {

		screen_id: 0,
		level_id: 0,
		items: [],
		all_items: [],
		sel_items: [],
		actions: [],
		pickup_times: 0,
		inventory: [],
		action_on: false,
		move_after: 0
	}
};

export default InitialState;
