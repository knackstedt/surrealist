import { Accordion, ActionIcon, Badge, Center, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { mdiArrowDownThin, mdiBroadcast, mdiDelete } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { LIVE_QUERY_COLORS } from "~/constants";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useRelativeTime } from "~/hooks/time";
import { LiveMessage } from "~/types";

export interface InboxPaneProps {
	messages: LiveMessage[];
	onClearAll: () => void;
}

export function InboxPane(props: InboxPaneProps) {
	const session = useActiveConnection();
	const format = useRelativeTime();

	const getMessageInfo = useStable((msg: LiveMessage) => {
		const index = session.liveQueries.findIndex((q) => q.id === msg.query.id);
		const color = LIVE_QUERY_COLORS[index % LIVE_QUERY_COLORS.length];

		return [index, color] as const;
	});

	return (
		<ContentPane
			title="Inbox"
			icon={mdiBroadcast}
			rightSection={
				<ActionIcon
					title="Clear all"
					onClick={props.onClearAll}
				>
					<Icon color="light.4" path={mdiDelete} />
				</ActionIcon>
			}
		>
			<ScrollArea
				style={{
					position: "absolute",
					inset: 12,
					top: 4,
				}}
			>
				<Accordion
					styles={{
						label: {
							paddingBlock: 8
						}
					}}
				>
					{props.messages.map(msg => {
						const [index, color] = getMessageInfo(msg);

						return (
							<Accordion.Item
								key={msg.id}
								value={msg.id}
							>
								<Accordion.Control
									pl="xs"
									icon={
										<Icon
											size={20}
											path={mdiArrowDownThin}
											color={color}
										/>
									}
								>
									<Group>
										<Badge color={color}>
											<Text c={color} fw={700}>
												{msg.action}
											</Text>
										</Badge>
										<Stack gap={0}>
											<Text c="gray" size="xs">
												Query {index + 1}
											</Text>
											<Text>
												{format(msg.timestamp)}
											</Text>
										</Stack>
									</Group>
								</Accordion.Control>
								<Accordion.Panel>
									<SurrealistEditor
										autoSize
										language="json"
										value={JSON.stringify(msg.result, null, 4)}
										options={{
											readOnly: true
										}}
									/>
								</Accordion.Panel>
							</Accordion.Item>
						);
					})}
				</Accordion>
			</ScrollArea>

			{props.messages.length === 0 && (
				<Center h="100%" c="light.5">
					No messages have been received yet
				</Center>
			)}
		</ContentPane>
	);
}