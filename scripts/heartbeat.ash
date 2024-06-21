void waittime()
{
int murmur = 0;
int heartbeat = 0;
int rollover = 1400 - gametime_to_int() / 60 / 1000;
while (rollover > 10)
	{

        Waitq(30);

        murmur += 1;

	if ( murmur == 20 ) // 10 minutes
		{
		murmur = 0;
		heartbeat += 1;
		rollover = 1400 - gametime_to_int() / 60 / 1000;
        	string PM = "Heartbeat[" + heartbeat + "], Rollover is in " + rollover + " minutes.";
		chat_private("ggames", PM);
		}
	}
}
void main()
{
	print("Heartbeat started");
	waittime();
}