import { useState } from "react";
import { QueriesPane } from "../QueriesPane";
import { InboxPane } from "../InboxPane";
import { useStable } from "~/hooks/stable";
import { useActiveConnection } from "~/hooks/connection";
import { newId } from "~/util/helpers";
import { useLater } from "~/hooks/later";
import { useLegacyLiveSocket } from "./legacy";
import { useImmer } from "use-immer";
import { LiveMessage } from "~/types";
import { MAX_LIVE_MESSAGES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { Panel, PanelGroup } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";

export interface QueryViewProps {
}

export function LiveView(props: QueryViewProps) {
	const { updateConnection } = useConfigStore.getState();

	const session = useActiveConnection();
	const [editingId, setEditingId] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [editingData, setEditingData] = useState<any>(null);
	const [activeQueries, setActiveQueries] = useState<string[]>([]);
	const [messages, setMessages] = useImmer<LiveMessage[]>([]);

	const handleLiveMessage = useStable((msg: any) => {
		setMessages((draft) => {
			draft.unshift(msg);

			if (draft.length > MAX_LIVE_MESSAGES) {
				draft.pop();
			}
		});
	});

	const clearMessages = useStable(() => {
		setMessages([]);
	});

	const socket = useLegacyLiveSocket({
		onLiveMessage: handleLiveMessage,
		onOpen() {
			setIsLoading(true);
		},
		onConnect() {
			setIsLoading(false);
		},
		onDisconnect() {
			setIsLoading(false);
			setActiveQueries([]);
		},
	});

	const startQueryLater = useLater(socket.startQuery);

	const toggleQuery = useStable(async (id: string) => {
		if (isLoading) {
			return;
		}

		if (activeQueries.includes(id)) {
			setActiveQueries(activeQueries.filter((x) => x !== id));

			socket.killQuery(id);

			if (activeQueries.length === 1) {
				socket.closeConnection();
			}
		} else {
			setActiveQueries([...activeQueries, id]);

			await socket.openConnection();
			
			startQueryLater(id);
		}
	});

	const handleNewQuery = useStable(() => {
		setEditingId("");
		setIsEditing(true);
		setEditingData(null);
	});

	const handleEditQuery = useStable((id: string) => {
		const index = session.liveQueries.findIndex((q) => q.id === id);
		const query = session.liveQueries[index];

		setEditingId(id);
		setIsEditing(true);
		setEditingData({
			index,
			name: query?.name || '',
			text: query?.text || ''
		});
	});

	const handleRemoveQuery = useStable((id: string) => {
		updateConnection({
			id: session.id,
			liveQueries: session.liveQueries.filter((q) => q.id !== id),
		});
	});

	const handleQuerySave = useStable((name: string, text: string) => {
		if (editingId.length === 0) {
			const id = newId();

			updateConnection({
				id: session.id,
				liveQueries: [...session.liveQueries, { id, name, text }],
			});
		} else {
			const queryIndex = session.liveQueries.findIndex((q) => q.id === editingId);

			updateConnection({
				id: session.id,
				liveQueries: session.liveQueries.with(queryIndex, {
					...session.liveQueries[queryIndex],
					name,
					text
				})
			});
		}

		setEditingId("");
		setIsEditing(false);
	});

	const handleQueryClose = useStable(() => {
		setEditingId("");
		setIsEditing(false);
	});

	return (
		<PanelGroup direction="horizontal">
			<Panel minSize={15} defaultSize={15} maxSize={25}>
				<QueriesPane
					activeQueries={activeQueries}
					toggleQuery={toggleQuery}
					onAddQuery={handleNewQuery}
					onEditQuery={handleEditQuery}
					onRemoveQuery={handleRemoveQuery}
				/>
			</Panel>
			<PanelDragger />
			<Panel minSize={25}>
				<InboxPane
					messages={messages}
					onClearAll={clearMessages}
				/>
			</Panel>
		</PanelGroup>

	// <Splitter
	// 	minSize={400}
	// 	values={splitValues}
	// 	onChange={setSplitValues}
	// 	direction="horizontal"
	// 	bufferSize={520}
	// 	startPane={
	// 		<Splitter
	// 			minSize={280}
	// 			values={innerSplitValues}
	// 			onChange={setInnerSplitValues}
	// 			bufferSize={100}
	// 			direction="vertical"
	// 			endPane={isEditing && (
	// 				<EditorPane
	// 					query={editingData}
	// 					onSave={handleQuerySave}
	// 					onClose={handleQueryClose}
	// 				/>
	// 			)}
	// 		>
				
				
	// 		</Splitter>
	// 	}
	// >
		
	// </Splitter>
	);
}
