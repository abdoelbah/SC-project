import { Box, Flex } from "@chakra-ui/react";


const HomePage = () => {



	return (
		<Flex gap='10' alignItems={"flex-start"}>
			<Box flex={70}>
				


			</Box>
			<Box
				flex={30}
				display={{
					base: "none",
					md: "block",
				}}
			>
			</Box>
		</Flex>
	);
};

export default HomePage;
